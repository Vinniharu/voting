import { ethers } from 'ethers'
import CryptoJS from 'crypto-js'
import { supabase } from '@/lib/supabase'

// Blockchain configuration
const BLOCKCHAIN_CONFIG = {
  network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || '',
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  voteSalt: process.env.VOTE_ANONYMIZATION_SALT || '',
  jwtSecret: process.env.JWT_SECRET || '',
}

// Smart contract ABI for voting validation
const VOTE_VALIDATION_ABI = [
  "function submitVoteHash(string memory electionId, bytes32 voteHash, bytes32 voterHash) public returns (uint256)",
  "function validateVote(string memory electionId, bytes32 voteHash) public view returns (bool, uint256, address)",
  "function getElectionVoteCount(string memory electionId) public view returns (uint256)",
  "function hasVoterVoted(string memory electionId, bytes32 voterHash) public view returns (bool)",
  "function getVoteTimestamp(string memory electionId, bytes32 voteHash) public view returns (uint256)",
  "event VoteValidated(string indexed electionId, bytes32 indexed voteHash, bytes32 indexed voterHash, uint256 timestamp)",
  "event VoteChallenged(string indexed electionId, bytes32 indexed voteHash, address challenger, string reason)"
]

export interface BlockchainVoteValidation {
  electionId: string
  voteId: string
  voteHash: string
  voterHash: string
  blockchainTxHash: string
  blockNumber: number
  gasUsed: string
  timestamp: Date
  isValid: boolean
  confirmations: number
}

export interface VoteIntegrityCheck {
  voteId: string
  originalHash: string
  currentHash: string
  isIntact: boolean
  lastVerified: Date
  blockchainConfirmed: boolean
  anomalies: string[]
}

export interface ElectionValidationStatus {
  electionId: string
  totalVotes: number
  validatedVotes: number
  pendingValidation: number
  invalidVotes: number
  blockchainSynced: boolean
  lastSyncTime: Date
  integrityScore: number
}

class BlockchainValidationService {
  private provider: ethers.JsonRpcProvider | null = null
  private signer: ethers.Wallet | null = null
  private contract: ethers.Contract | null = null
  private contractAddress: string = process.env.VOTE_VALIDATION_CONTRACT_ADDRESS || ''

  constructor() {
    if (BLOCKCHAIN_CONFIG.rpcUrl && BLOCKCHAIN_CONFIG.privateKey) {
      this.provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl)
      this.signer = new ethers.Wallet(BLOCKCHAIN_CONFIG.privateKey, this.provider)
      this.initializeContract()
    }
  }

  private async initializeContract(): Promise<void> {
    try {
      if (this.contractAddress) {
        this.contract = new ethers.Contract(this.contractAddress, VOTE_VALIDATION_ABI, this.signer)
      }
    } catch (error) {
      console.error('Failed to initialize blockchain contract:', error)
    }
  }

  // Generate cryptographic hash for vote validation
  generateVoteHash(electionId: string, candidateIds: string[], voterEmail?: string, timestamp?: Date): string {
    const voteData = {
      electionId,
      candidateIds: candidateIds.sort(), // Sort to ensure consistent hash
      timestamp: timestamp?.toISOString() || new Date().toISOString(),
      salt: BLOCKCHAIN_CONFIG.voteSalt
    }
    
    const dataString = JSON.stringify(voteData)
    return CryptoJS.SHA256(dataString).toString()
  }

  // Generate anonymous voter hash
  generateVoterHash(voterEmail: string, electionId: string): string {
    const voterData = `${voterEmail}:${electionId}:${BLOCKCHAIN_CONFIG.voteSalt}`
    return CryptoJS.SHA256(voterData).toString()
  }

  // Validate vote before submission
  async validateVoteSubmission(
    electionId: string,
    candidateIds: string[],
    voterEmail?: string
  ): Promise<{
    isValid: boolean
    voteHash: string
    voterHash: string
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      // Generate hashes
      const voteHash = this.generateVoteHash(electionId, candidateIds, voterEmail)
      const voterHash = voterEmail ? this.generateVoterHash(voterEmail, electionId) : ''

      // Check if voter has already voted (if email provided)
      if (voterEmail && this.contract) {
        try {
          const hasVoted = await this.contract.hasVoterVoted(electionId, voterHash)
          if (hasVoted) {
            errors.push('Voter has already cast a vote in this election')
          }
        } catch (error) {
          console.warn('Could not check blockchain vote status:', error)
        }
      }

      // Validate election exists and is active
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single()

      if (electionError || !election) {
        errors.push('Election not found')
      } else {
        const now = new Date()
        const startDate = new Date(election.start_date)
        const endDate = new Date(election.end_date)

        if (now < startDate) {
          errors.push('Election has not started yet')
        }
        if (now > endDate) {
          errors.push('Election has ended')
        }
      }

      // Validate candidates exist
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('id')
        .eq('election_id', electionId)
        .in('id', candidateIds)

      if (candidatesError || !candidates || candidates.length !== candidateIds.length) {
        errors.push('Invalid candidate selection')
      }

      return {
        isValid: errors.length === 0,
        voteHash,
        voterHash,
        errors
      }
    } catch (error) {
      console.error('Vote validation error:', error)
      return {
        isValid: false,
        voteHash: '',
        voterHash: '',
        errors: ['Validation service error']
      }
    }
  }

  // Submit vote with blockchain validation
  async submitValidatedVote(
    electionId: string,
    candidateIds: string[],
    voterEmail?: string
  ): Promise<BlockchainVoteValidation | null> {
    try {
      // First validate the vote
      const validation = await this.validateVoteSubmission(electionId, candidateIds, voterEmail)
      
      if (!validation.isValid) {
        throw new Error(`Vote validation failed: ${validation.errors.join(', ')}`)
      }

      // Submit to database first
      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .insert({
          election_id: electionId,
          candidate_ids: candidateIds,
          voter_email: voterEmail || null,
          vote_hash: validation.voteHash,
          voter_hash: validation.voterHash || null,
        })
        .select()
        .single()

      if (voteError) {
        throw new Error(`Database error: ${voteError.message}`)
      }

      // Submit to blockchain for validation
      let blockchainValidation: BlockchainVoteValidation | null = null

      if (this.contract) {
        try {
          const tx = await this.contract.submitVoteHash(
            electionId,
            validation.voteHash,
            validation.voterHash || ethers.ZeroHash
          )

          const receipt = await tx.wait()

          blockchainValidation = {
            electionId,
            voteId: vote.id,
            voteHash: validation.voteHash,
            voterHash: validation.voterHash,
            blockchainTxHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            timestamp: new Date(),
            isValid: true,
            confirmations: receipt.confirmations
          }

          // Update vote record with blockchain info
          await supabase
            .from('votes')
            .update({
              blockchain_tx_hash: receipt.hash,
              blockchain_validated: true,
              blockchain_block_number: receipt.blockNumber
            })
            .eq('id', vote.id)

        } catch (blockchainError) {
          console.error('Blockchain submission failed:', blockchainError)
          // Vote is still recorded in database, but not blockchain validated
          blockchainValidation = {
            electionId,
            voteId: vote.id,
            voteHash: validation.voteHash,
            voterHash: validation.voterHash,
            blockchainTxHash: '',
            blockNumber: 0,
            gasUsed: '0',
            timestamp: new Date(),
            isValid: false,
            confirmations: 0
          }
        }
      }

      return blockchainValidation
    } catch (error) {
      console.error('Vote submission error:', error)
      throw error
    }
  }

  // Verify vote integrity
  async verifyVoteIntegrity(voteId: string): Promise<VoteIntegrityCheck> {
    try {
      // Get vote from database
      const { data: vote, error } = await supabase
        .from('votes')
        .select('*')
        .eq('id', voteId)
        .single()

      if (error || !vote) {
        throw new Error('Vote not found')
      }

      // Recalculate hash
      const currentHash = this.generateVoteHash(
        vote.election_id,
        vote.candidate_ids,
        vote.voter_email,
        new Date(vote.created_at)
      )

      const anomalies: string[] = []
      let blockchainConfirmed = false

      // Check hash integrity
      const isIntact = vote.vote_hash === currentHash
      if (!isIntact) {
        anomalies.push('Vote hash mismatch - possible tampering detected')
      }

      // Verify blockchain confirmation if available
      if (vote.blockchain_tx_hash && this.contract) {
        try {
          const [isValid] = await this.contract.validateVote(vote.election_id, vote.vote_hash)
          blockchainConfirmed = isValid
          if (!isValid) {
            anomalies.push('Blockchain validation failed')
          }
        } catch (error) {
          anomalies.push('Could not verify blockchain status')
        }
      }

      return {
        voteId,
        originalHash: vote.vote_hash,
        currentHash,
        isIntact,
        lastVerified: new Date(),
        blockchainConfirmed,
        anomalies
      }
    } catch (error) {
      console.error('Vote integrity check error:', error)
      throw error
    }
  }

  // Get election validation status
  async getElectionValidationStatus(electionId: string): Promise<ElectionValidationStatus> {
    try {
      // Get vote counts from database
      const { data: votes, error } = await supabase
        .from('votes')
        .select('id, blockchain_validated, blockchain_tx_hash')
        .eq('election_id', electionId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const totalVotes = votes?.length || 0
      const validatedVotes = votes?.filter(v => v.blockchain_validated)?.length || 0
      const pendingValidation = votes?.filter(v => v.blockchain_tx_hash && !v.blockchain_validated)?.length || 0
      const invalidVotes = totalVotes - validatedVotes - pendingValidation

      // Check blockchain sync status
      let blockchainSynced = false
      if (this.contract && totalVotes > 0) {
        try {
          const blockchainCount = await this.contract.getElectionVoteCount(electionId)
          blockchainSynced = parseInt(blockchainCount.toString()) === validatedVotes
        } catch (error) {
          console.warn('Could not check blockchain sync status:', error)
        }
      }

      // Calculate integrity score (0-100)
      const integrityScore = totalVotes > 0 ? Math.round((validatedVotes / totalVotes) * 100) : 100

      return {
        electionId,
        totalVotes,
        validatedVotes,
        pendingValidation,
        invalidVotes,
        blockchainSynced,
        lastSyncTime: new Date(),
        integrityScore
      }
    } catch (error) {
      console.error('Election validation status error:', error)
      throw error
    }
  }

  // Batch verify multiple votes
  async batchVerifyVotes(voteIds: string[]): Promise<VoteIntegrityCheck[]> {
    const results: VoteIntegrityCheck[] = []
    
    for (const voteId of voteIds) {
      try {
        const check = await this.verifyVoteIntegrity(voteId)
        results.push(check)
      } catch (error) {
        console.error(`Failed to verify vote ${voteId}:`, error)
        results.push({
          voteId,
          originalHash: '',
          currentHash: '',
          isIntact: false,
          lastVerified: new Date(),
          blockchainConfirmed: false,
          anomalies: ['Verification failed']
        })
      }
    }

    return results
  }

  // Generate audit report for election
  async generateAuditReport(electionId: string): Promise<{
    electionId: string
    timestamp: Date
    summary: ElectionValidationStatus
    voteChecks: VoteIntegrityCheck[]
    recommendations: string[]
  }> {
    try {
      const summary = await this.getElectionValidationStatus(electionId)
      
      // Get all votes for detailed check
      const { data: votes } = await supabase
        .from('votes')
        .select('id')
        .eq('election_id', electionId)

      const voteIds = votes?.map(v => v.id) || []
      const voteChecks = await this.batchVerifyVotes(voteIds)

      // Generate recommendations
      const recommendations: string[] = []
      
      if (summary.integrityScore < 90) {
        recommendations.push('Low integrity score detected - investigate vote anomalies')
      }
      
      if (!summary.blockchainSynced) {
        recommendations.push('Blockchain sync required - some votes not validated on-chain')
      }
      
      if (summary.invalidVotes > 0) {
        recommendations.push('Invalid votes detected - manual review recommended')
      }

      const anomalyCount = voteChecks.filter(v => v.anomalies.length > 0).length
      if (anomalyCount > 0) {
        recommendations.push(`${anomalyCount} votes have integrity issues - detailed investigation needed`)
      }

      return {
        electionId,
        timestamp: new Date(),
        summary,
        voteChecks,
        recommendations
      }
    } catch (error) {
      console.error('Audit report generation error:', error)
      throw error
    }
  }

  // Check if blockchain service is available
  isBlockchainAvailable(): boolean {
    return !!(this.provider && this.signer && BLOCKCHAIN_CONFIG.rpcUrl && BLOCKCHAIN_CONFIG.privateKey)
  }

  // Get blockchain network status
  async getNetworkStatus(): Promise<{
    isConnected: boolean
    blockNumber: number
    gasPrice: string
    networkId: number
    contractAddress: string
  }> {
    try {
      if (!this.provider) {
        return {
          isConnected: false,
          blockNumber: 0,
          gasPrice: '0',
          networkId: 0,
          contractAddress: ''
        }
      }

      const [blockNumber, feeData, network] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData(),
        this.provider.getNetwork()
      ])

      return {
        isConnected: true,
        blockNumber,
        gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
        networkId: Number(network.chainId),
        contractAddress: this.contractAddress
      }
    } catch (error) {
      console.error('Network status check error:', error)
      return {
        isConnected: false,
        blockNumber: 0,
        gasPrice: '0',
        networkId: 0,
        contractAddress: ''
      }
    }
  }
}

// Export singleton instance
export const blockchainValidationService = new BlockchainValidationService() 
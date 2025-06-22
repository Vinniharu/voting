import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

// Environment configuration
const BLOCKCHAIN_CONFIG = {
  network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || '',
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  voteSalt: process.env.VOTE_ANONYMIZATION_SALT || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
};

// Smart contract ABI for voting
const VOTING_CONTRACT_ABI = [
  "function createElection(string memory title, string[] memory candidates, uint256 endTime) public returns (uint256)",
  "function vote(uint256 electionId, uint256 candidateIndex, bytes32 voteHash) public",
  "function getElectionResults(uint256 electionId) public view returns (uint256[] memory)",
  "function getElection(uint256 electionId) public view returns (string memory, string[] memory, uint256, bool, uint256)",
  "function hasVoted(uint256 electionId, address voter) public view returns (bool)",
  "function getVoteCount(uint256 electionId) public view returns (uint256)",
  "event ElectionCreated(uint256 indexed electionId, string title, address creator)",
  "event VoteCast(uint256 indexed electionId, address indexed voter, bytes32 voteHash)"
];

export interface Election {
  id: string;
  title: string;
  description: string;
  candidates: Candidate[];
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  totalVotes: number;
  blockchainTxHash?: string;
  voteLink: string;
  createdBy: string;
  isPublic: boolean;
  requirements?: VotingRequirement[];
}

export interface Candidate {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  voteCount: number;
  percentage: number;
}

export interface VotingRequirement {
  type: 'age' | 'membership' | 'verification' | 'custom';
  value: string;
  description: string;
}

export interface BlockchainVote {
  electionId: string;
  candidateId: string;
  voterHash: string;
  timestamp: Date;
  blockHash: string;
  transactionHash: string;
  gasUsed: number;
  confirmations: number;
}

export interface VoteLink {
  id: string;
  electionId: string;
  url: string;
  expiresAt: Date;
  isActive: boolean;
  clickCount: number;
  maxUses?: number;
}

class BlockchainVotingService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl);
    this.signer = new ethers.Wallet(BLOCKCHAIN_CONFIG.privateKey, this.provider);
  }

  // Initialize contract connection
  async initializeContract(contractAddress: string): Promise<void> {
    try {
      this.contract = new ethers.Contract(contractAddress, VOTING_CONTRACT_ABI, this.signer);
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      throw new Error('Contract initialization failed');
    }
  }

  // Create a new election on the blockchain
  async createElection(election: Omit<Election, 'id' | 'voteLink' | 'totalVotes'>): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const candidateNames = election.candidates.map(c => c.name);
      const endTime = Math.floor(election.endDate.getTime() / 1000);

      const tx = await this.contract.createElection(
        election.title,
        candidateNames,
        endTime
      );

      const receipt = await tx.wait();
      const electionId = receipt.logs[0].args[0].toString();

      return electionId;
    } catch (error) {
      console.error('Failed to create election on blockchain:', error);
      throw new Error('Election creation failed');
    }
  }

  // Generate a secure vote link
  generateVoteLink(electionId: string, voterId?: string): VoteLink {
    const linkId = this.generateSecureId();
    const token = this.encryptVoteToken(electionId, voterId, linkId);
    
    const voteLink: VoteLink = {
      id: linkId,
      electionId,
      url: `${BLOCKCHAIN_CONFIG.appUrl}/vote/${electionId}?token=${token}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isActive: true,
      clickCount: 0,
      maxUses: voterId ? 1 : undefined // Single use for specific voter
    };

    return voteLink;
  }

  // Cast a vote on the blockchain
  async castVote(electionId: string, candidateId: string, voterAddress: string): Promise<BlockchainVote> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // Create anonymous vote hash
      const voteHash = this.createVoteHash(electionId, candidateId, voterAddress);
      const candidateIndex = parseInt(candidateId);

      const tx = await this.contract.vote(electionId, candidateIndex, voteHash);
      const receipt = await tx.wait();

      const blockchainVote: BlockchainVote = {
        electionId,
        candidateId,
        voterHash: voteHash,
        timestamp: new Date(),
        blockHash: receipt.blockHash,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: receipt.confirmations
      };

      return blockchainVote;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      throw new Error('Vote casting failed');
    }
  }

  // Get election results from blockchain
  async getElectionResults(electionId: string): Promise<number[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const results = await this.contract.getElectionResults(electionId);
      return results.map((count: ethers.BigNumberish) => parseInt(count.toString()));
    } catch (error) {
      console.error('Failed to get election results:', error);
      throw new Error('Failed to retrieve results');
    }
  }

  // Check if a voter has already voted
  async hasVoted(electionId: string, voterAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.hasVoted(electionId, voterAddress);
    } catch (error) {
      console.error('Failed to check vote status:', error);
      return false;
    }
  }

  // Get total vote count for an election
  async getVoteCount(electionId: string): Promise<number> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const count = await this.contract.getVoteCount(electionId);
      return parseInt(count.toString());
    } catch (error) {
      console.error('Failed to get vote count:', error);
      return 0;
    }
  }

  // Verify vote authenticity
  async verifyVote(transactionHash: string): Promise<boolean> {
    try {
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      return receipt !== null && receipt.status === 1;
    } catch (error) {
      console.error('Failed to verify vote:', error);
      return false;
    }
  }

  // Get blockchain network status
  async getNetworkStatus(): Promise<{
    blockNumber: number;
    gasPrice: string;
    networkId: number;
    isConnected: boolean;
  }> {
    try {
      const [blockNumber, gasPrice, network] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData(),
        this.provider.getNetwork()
      ]);

      return {
        blockNumber,
        gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'),
        networkId: Number(network.chainId),
        isConnected: true
      };
    } catch (error) {
      console.error('Failed to get network status:', error);
      return {
        blockNumber: 0,
        gasPrice: '0',
        networkId: 0,
        isConnected: false
      };
    }
  }

  // Private helper methods
  private generateSecureId(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  private encryptVoteToken(electionId: string, voterId: string = '', linkId: string): string {
    const payload = JSON.stringify({
      electionId,
      voterId,
      linkId,
      timestamp: Date.now()
    });

    return CryptoJS.AES.encrypt(payload, BLOCKCHAIN_CONFIG.encryptionKey).toString();
  }

  private createVoteHash(electionId: string, candidateId: string, voterAddress: string): string {
    const data = `${electionId}:${candidateId}:${voterAddress}:${BLOCKCHAIN_CONFIG.voteSalt}`;
    return CryptoJS.SHA256(data).toString();
  }

  // Decrypt vote token
  decryptVoteToken(encryptedToken: string): {
    electionId: string;
    voterId: string;
    linkId: string;
    timestamp: number;
  } | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedToken, BLOCKCHAIN_CONFIG.encryptionKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Failed to decrypt vote token:', error);
      return null;
    }
  }

  // Validate vote link
  validateVoteLink(voteLink: VoteLink): boolean {
    const now = new Date();
    
    if (!voteLink.isActive) return false;
    if (voteLink.expiresAt < now) return false;
    if (voteLink.maxUses && voteLink.clickCount >= voteLink.maxUses) return false;
    
    return true;
  }

  // Generate shareable vote links for different platforms
  generateShareableLinks(election: Election): {
    direct: string;
    email: string;
    sms: string;
    social: string;
  } {
    const baseUrl = election.voteLink;
    const title = encodeURIComponent(election.title);
    const description = encodeURIComponent(`Vote in: ${election.title}`);

    return {
      direct: baseUrl,
      email: `mailto:?subject=${title}&body=${description}%0A%0A${baseUrl}`,
      sms: `sms:?body=${description}%20${baseUrl}`,
      social: `https://twitter.com/intent/tweet?text=${description}&url=${baseUrl}`
    };
  }
}

// Export singleton instance
export const blockchainService = new BlockchainVotingService();

// Export utility functions
export const generateVoteLink = (electionId: string, voterId?: string) => 
  blockchainService.generateVoteLink(electionId, voterId);

export const validateVoteToken = (token: string) => 
  blockchainService.decryptVoteToken(token);

export const createShareableLinks = (election: Election) => 
  blockchainService.generateShareableLinks(election); 
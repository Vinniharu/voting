import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { blockchainValidationService } from '@/lib/blockchain-validation'

// GET - Get blockchain validation status and network information
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const electionId = url.searchParams.get('electionId')
    const voteId = url.searchParams.get('voteId')

    // Get the token from the cookie for authentication
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'network-status':
        try {
          const networkStatus = await blockchainValidationService.getNetworkStatus()
          const isAvailable = blockchainValidationService.isBlockchainAvailable()
          
          return NextResponse.json({
            blockchain: {
              available: isAvailable,
              network: networkStatus
            },
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to get network status' },
            { status: 500 }
          )
        }

      case 'election-audit':
        if (!electionId) {
          return NextResponse.json(
            { error: 'Election ID required for audit' },
            { status: 400 }
          )
        }

        try {
          // Verify user owns the election
          const { data: election, error: electionError } = await supabase
            .from('elections')
            .select('creator_id')
            .eq('id', electionId)
            .single()

          if (electionError || !election) {
            return NextResponse.json(
              { error: 'Election not found' },
              { status: 404 }
            )
          }

          if (election.creator_id !== user.id) {
            return NextResponse.json(
              { error: 'Unauthorized - you can only audit your own elections' },
              { status: 403 }
            )
          }

          const auditReport = await blockchainValidationService.generateAuditReport(electionId)
          
          return NextResponse.json({
            audit: auditReport,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Audit report generation error:', error)
          return NextResponse.json(
            { error: 'Failed to generate audit report' },
            { status: 500 }
          )
        }

      case 'vote-integrity':
        if (!voteId) {
          return NextResponse.json(
            { error: 'Vote ID required for integrity check' },
            { status: 400 }
          )
        }

        try {
          // Verify user owns the election containing this vote
          const { data: vote, error: voteError } = await supabase
            .from('votes')
            .select(`
              id,
              election_id,
              elections!inner (
                creator_id
              )
            `)
            .eq('id', voteId)
            .single()

          if (voteError || !vote) {
            return NextResponse.json(
              { error: 'Vote not found' },
              { status: 404 }
            )
          }

          if (vote.elections.creator_id !== user.id) {
            return NextResponse.json(
              { error: 'Unauthorized - you can only check integrity of votes in your elections' },
              { status: 403 }
            )
          }

          const integrityCheck = await blockchainValidationService.verifyVoteIntegrity(voteId)
          
          return NextResponse.json({
            integrity: integrityCheck,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Vote integrity check error:', error)
          return NextResponse.json(
            { error: 'Failed to verify vote integrity' },
            { status: 500 }
          )
        }

      case 'validation-status':
        if (!electionId) {
          return NextResponse.json(
            { error: 'Election ID required for validation status' },
            { status: 400 }
          )
        }

        try {
          // Verify user owns the election
          const { data: election, error: electionError } = await supabase
            .from('elections')
            .select('creator_id')
            .eq('id', electionId)
            .single()

          if (electionError || !election) {
            return NextResponse.json(
              { error: 'Election not found' },
              { status: 404 }
            )
          }

          if (election.creator_id !== user.id) {
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 403 }
            )
          }

          const validationStatus = await blockchainValidationService.getElectionValidationStatus(electionId)
          
          return NextResponse.json({
            validation: validationStatus,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Validation status error:', error)
          return NextResponse.json(
            { error: 'Failed to get validation status' },
            { status: 500 }
          )
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: network-status, election-audit, vote-integrity, validation-status' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Blockchain validation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Perform blockchain validation operations
export async function POST(request: NextRequest) {
  try {
    const { action, electionId, voteIds, data } = await request.json()

    // Get the token from the cookie for authentication
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'batch-verify':
        if (!voteIds || !Array.isArray(voteIds)) {
          return NextResponse.json(
            { error: 'Vote IDs array required for batch verification' },
            { status: 400 }
          )
        }

        try {
          // Verify user owns all votes through their elections
          const { data: votes, error: votesError } = await supabase
            .from('votes')
            .select(`
              id,
              election_id,
              elections!inner (
                creator_id
              )
            `)
            .in('id', voteIds)

          if (votesError || !votes) {
            return NextResponse.json(
              { error: 'Failed to verify vote ownership' },
              { status: 500 }
            )
          }

          // Check if user owns all elections
          const unauthorizedVotes = votes.filter(vote => vote.elections.creator_id !== user.id)
          if (unauthorizedVotes.length > 0) {
            return NextResponse.json(
              { error: 'Unauthorized - you can only verify votes in your own elections' },
              { status: 403 }
            )
          }

          const batchResults = await blockchainValidationService.batchVerifyVotes(voteIds)
          
          return NextResponse.json({
            batchVerification: {
              totalVotes: voteIds.length,
              results: batchResults,
              summary: {
                intact: batchResults.filter(r => r.isIntact).length,
                compromised: batchResults.filter(r => !r.isIntact).length,
                blockchainConfirmed: batchResults.filter(r => r.blockchainConfirmed).length
              }
            },
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Batch verification error:', error)
          return NextResponse.json(
            { error: 'Failed to perform batch verification' },
            { status: 500 }
          )
        }

      case 'revalidate-vote':
        const { voteId } = data || {}
        if (!voteId) {
          return NextResponse.json(
            { error: 'Vote ID required for revalidation' },
            { status: 400 }
          )
        }

        try {
          // Verify user owns the election containing this vote
          const { data: vote, error: voteError } = await supabase
            .from('votes')
            .select(`
              id,
              election_id,
              candidate_ids,
              voter_email,
              elections!inner (
                creator_id
              )
            `)
            .eq('id', voteId)
            .single()

          if (voteError || !vote) {
            return NextResponse.json(
              { error: 'Vote not found' },
              { status: 404 }
            )
          }

          if (vote.elections.creator_id !== user.id) {
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 403 }
            )
          }

          // Perform integrity check
          const integrityCheck = await blockchainValidationService.verifyVoteIntegrity(voteId)
          
          // Update vote record with integrity check results
          await supabase
            .from('votes')
            .update({
              integrity_verified: integrityCheck.isIntact,
              last_integrity_check: new Date().toISOString(),
              validation_errors: integrityCheck.anomalies.length > 0 ? integrityCheck.anomalies : null
            })
            .eq('id', voteId)

          return NextResponse.json({
            revalidation: {
              voteId,
              integrityCheck,
              updated: true
            },
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Vote revalidation error:', error)
          return NextResponse.json(
            { error: 'Failed to revalidate vote' },
            { status: 500 }
          )
        }

      case 'sync-blockchain':
        if (!electionId) {
          return NextResponse.json(
            { error: 'Election ID required for blockchain sync' },
            { status: 400 }
          )
        }

        try {
          // Verify user owns the election
          const { data: election, error: electionError } = await supabase
            .from('elections')
            .select('creator_id')
            .eq('id', electionId)
            .single()

          if (electionError || !election) {
            return NextResponse.json(
              { error: 'Election not found' },
              { status: 404 }
            )
          }

          if (election.creator_id !== user.id) {
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 403 }
            )
          }

          // Get current validation status
          const validationStatus = await blockchainValidationService.getElectionValidationStatus(electionId)
          
          // Update blockchain validation status table
          await supabase
            .from('blockchain_validation_status')
            .upsert({
              election_id: electionId,
              total_votes: validationStatus.totalVotes,
              validated_votes: validationStatus.validatedVotes,
              pending_validation: validationStatus.pendingValidation,
              invalid_votes: validationStatus.invalidVotes,
              integrity_score: validationStatus.integrityScore,
              blockchain_synced: validationStatus.blockchainSynced,
              last_sync_time: new Date().toISOString(),
              network_status: await blockchainValidationService.getNetworkStatus()
            })

          return NextResponse.json({
            sync: {
              electionId,
              status: validationStatus,
              synced: true
            },
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Blockchain sync error:', error)
          return NextResponse.json(
            { error: 'Failed to sync blockchain status' },
            { status: 500 }
          )
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: batch-verify, revalidate-vote, sync-blockchain' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Blockchain validation POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
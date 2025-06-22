import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const electionId = resolvedParams.id
    const { candidateIds, voterEmail } = await request.json()

    console.log('Vote submission:', { electionId, candidateIds, voterEmail })

    // Basic validation
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one candidate' },
        { status: 400 }
      )
    }

    // Check if election exists and is active
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      return NextResponse.json(
        { error: 'Election not found' },
        { status: 404 }
      )
    }

    // Check if election is active (between start and end dates)
    const now = new Date()
    const startDate = new Date(election.start_date)
    const endDate = new Date(election.end_date)

    if (now < startDate) {
      return NextResponse.json(
        { error: 'Election has not started yet' },
        { status: 400 }
      )
    }

    if (now > endDate) {
      return NextResponse.json(
        { error: 'Election has ended' },
        { status: 400 }
      )
    }

    // Check if email is required but not provided
    if (election.require_voter_registration && !voterEmail) {
      return NextResponse.json(
        { error: 'Email is required for this election' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (voterEmail) {
      const emailRegex = /\S+@\S+\.\S+/
      if (!emailRegex.test(voterEmail)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }
    }

    // Check if voter has already voted (only if email is provided)
    if (voterEmail) {
      const { data: existingVote, error: voteCheckError } = await supabase
        .from('votes')
        .select('id')
        .eq('election_id', electionId)
        .eq('voter_email', voterEmail)
        .single()

      if (existingVote) {
        return NextResponse.json(
          { error: 'You have already voted in this election' },
          { status: 409 }
        )
      }
    }

    // Validate candidates exist in this election
    const { data: validCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('id')
      .eq('election_id', electionId)
      .in('id', candidateIds)

    if (candidatesError || !validCandidates || validCandidates.length !== candidateIds.length) {
      return NextResponse.json(
        { error: 'Invalid candidate selection' },
        { status: 400 }
      )
    }

    // Check voting policy (single vs multiple votes)
    if (!election.allow_multiple_votes && candidateIds.length > 1) {
      return NextResponse.json(
        { error: 'This election only allows voting for one candidate' },
        { status: 400 }
      )
    }

    // Insert the vote
    const { data: vote, error: insertError } = await supabase
      .from('votes')
      .insert({
        election_id: electionId,
        candidate_ids: candidateIds,
        voter_email: voterEmail || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Vote insertion error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit vote. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Vote submitted successfully:', vote.id)

    return NextResponse.json({
      message: 'Vote submitted successfully!',
      voteId: vote.id
    }, { status: 201 })

  } catch (error) {
    console.error('Vote submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Simple endpoint to get vote counts for an election
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const electionId = resolvedParams.id

    // Get election info
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      return NextResponse.json(
        { error: 'Election not found' },
        { status: 404 }
      )
    }

    // Get all votes for this election
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('candidate_ids')
      .eq('election_id', electionId)

    if (votesError) {
      return NextResponse.json(
        { error: 'Failed to get vote counts' },
        { status: 500 }
      )
    }

    // Count votes for each candidate
    const voteCounts: { [candidateId: string]: number } = {}
    
    votes.forEach(vote => {
      if (vote.candidate_ids && Array.isArray(vote.candidate_ids)) {
        vote.candidate_ids.forEach(candidateId => {
          voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1
        })
      }
    })

    return NextResponse.json({
      electionId,
      totalVotes: votes.length,
      voteCounts
    })

  } catch (error) {
    console.error('Vote count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
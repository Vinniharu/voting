import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const electionId = params.id

    // Get election details
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

    // Get vote counts for each candidate
    const { data: voteCounts, error: voteError } = await supabase
      .from('votes')
      .select('candidate_id')
      .eq('election_id', electionId)

    if (voteError) {
      return NextResponse.json(
        { error: 'Failed to fetch vote data' },
        { status: 500 }
      )
    }

    // Count votes per candidate
    const candidateVotes: { [key: string]: number } = {}
    voteCounts?.forEach(vote => {
      candidateVotes[vote.candidate_id] = (candidateVotes[vote.candidate_id] || 0) + 1
    })

    const totalVotes = voteCounts?.length || 0

    // Create results array with candidate information
    const results = election.candidates.map((candidate: any) => {
      const voteCount = candidateVotes[candidate.id] || 0
      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0

      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        voteCount,
        percentage
      }
    })

    // Format election data
    const formattedElection = {
      id: election.id,
      title: election.title,
      description: election.description,
      startDate: election.start_date,
      endDate: election.end_date,
      candidates: election.candidates,
      status: election.status
    }

    return NextResponse.json({
      election: formattedElection,
      results,
      totalVotes
    })

  } catch (error) {
    console.error('Error fetching election results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface VoteResult {
  candidateId: string
  candidateName: string
  description: string | null
  voteCount: number
  percentage: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()
    const electionId = resolvedParams.id

    // Get election details with candidates
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select(`
        *,
        candidates (
          id,
          name,
          description
        )
      `)
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      return NextResponse.json(
        { error: 'Election not found' },
        { status: 404 }
      )
    }

    // Get votes for this election
    const { data: votes, error: voteError } = await supabase
      .from('votes')
      .select('candidate_ids')
      .eq('election_id', electionId)

    if (voteError) {
      console.error('Vote fetch error:', voteError)
      return NextResponse.json(
        { error: 'Failed to fetch vote data' },
        { status: 500 }
      )
    }

    // Count votes per candidate
    const candidateVotes: { [key: string]: number } = {}
    
    // Initialize all candidates with 0 votes
    election.candidates.forEach((candidate: any) => {
      candidateVotes[candidate.id] = 0
    })

    // Count votes (candidate_ids is an array in each vote)
    votes?.forEach(vote => {
      if (vote.candidate_ids && Array.isArray(vote.candidate_ids)) {
        vote.candidate_ids.forEach((candidateId: string) => {
          candidateVotes[candidateId] = (candidateVotes[candidateId] || 0) + 1
        })
      }
    })

    const totalVotes = votes?.length || 0

    // Create results array with candidate information
    const results: VoteResult[] = election.candidates.map((candidate: any) => {
      const voteCount = candidateVotes[candidate.id] || 0
      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0

      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        description: candidate.description,
        voteCount,
        percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
      }
    })

    // Sort by vote count descending
    results.sort((a, b) => b.voteCount - a.voteCount)

    // Determine winner
    const winner = results.length > 0 ? results[0] : null

    // Format election data
    const formattedElection = {
      id: election.id,
      title: election.title,
      description: election.description,
      startDate: election.start_date,
      endDate: election.end_date,
      status: election.status,
      voteCount: election.vote_count || 0
    }

    return NextResponse.json({
      election: formattedElection,
      results,
      totalVotes,
      winner
    })

  } catch (error) {
    console.error('Error fetching election results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
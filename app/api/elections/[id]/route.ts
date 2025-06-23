import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()
    const electionId = resolvedParams.id

    // Get election with candidates
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select(`
        *,
        candidates (
          id,
          name,
          description
        ),
        users!elections_creator_id_fkey (
          full_name
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

    // Transform the data to match the expected format
    const response = {
      id: election.id,
      title: election.title,
      description: election.description,
      startDate: election.start_date,
      endDate: election.end_date,
      candidates: election.candidates.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description
      })),
      allowMultipleVotes: election.allow_multiple_votes,
      requireVoterRegistration: election.require_voter_registration,
      creatorId: election.creator_id,
      creatorName: election.users?.full_name || 'Unknown',
      createdAt: election.created_at,
      voteCount: election.vote_count,
      status: election.status
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Election fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
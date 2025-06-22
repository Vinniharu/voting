import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface Election {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  candidates: string[]
  votingPolicy: 'one-vote' | 'multiple-votes'
  requiresRegistration: boolean
  creatorId: string
  createdAt: string
  voteCount: number
  status: 'draft' | 'active' | 'ended'
}

export async function POST(request: NextRequest) {
  try {
    // Get the token from the cookie
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

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      startDate,
      endDate,
      candidates,
      votingPolicy,
      requiresRegistration
    } = body

    // Validate required fields
    if (!title || !description || !startDate || !endDate || !candidates || !votingPolicy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate candidates
    if (!Array.isArray(candidates) || candidates.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 candidates are required' },
        { status: 400 }
      )
    }

    // Determine election status
    let status: 'draft' | 'active' | 'ended' = 'draft'
    if (now >= start && now <= end) {
      status = 'active'
    } else if (now > end) {
      status = 'ended'
    }

    // Create election in database
    const { data: election, error: insertError } = await supabase
      .from('elections')
      .insert({
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        allow_multiple_votes: votingPolicy === 'multiple-votes',
        require_voter_registration: requiresRegistration || false,
        creator_id: user.id,
        status
      })
      .select()
      .single()

    if (insertError) {
      console.error('Election creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create election' },
        { status: 500 }
      )
    }

    // Insert candidates
    const candidateInserts = candidates.map((candidate: string) => ({
      name: candidate,
      election_id: election.id,
      description: '' // Default empty description
    }))

    const { error: candidatesError } = await supabase
      .from('candidates')
      .insert(candidateInserts)

    if (candidatesError) {
      console.error('Candidates creation error:', candidatesError)
      // Rollback election if candidates fail
      await supabase.from('elections').delete().eq('id', election.id)
      return NextResponse.json(
        { error: 'Failed to create candidates' },
        { status: 500 }
      )
    }

    // Return the created election
    const response = {
      id: election.id,
      title: election.title,
      description: election.description,
      startDate: election.start_date,
      endDate: election.end_date,
      candidates,
      votingPolicy: election.allow_multiple_votes ? 'multiple-votes' : 'one-vote',
      requiresRegistration: election.require_voter_registration,
      creatorId: election.creator_id,
      createdAt: election.created_at,
      voteCount: election.vote_count,
      status: election.status
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Election creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the token from the cookie
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

    // Get elections created by the user
    const { data: elections, error: electionsError } = await supabase
      .from('elections')
      .select(`
        *,
        candidates (
          id,
          name,
          description
        )
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    if (electionsError) {
      console.error('Elections fetch error:', electionsError)
      return NextResponse.json(
        { error: 'Failed to fetch elections' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedElections = elections.map(election => ({
      id: election.id,
      title: election.title,
      description: election.description,
      startDate: election.start_date,
      endDate: election.end_date,
      candidates: election.candidates.map((c: any) => c.name),
      votingPolicy: election.allow_multiple_votes ? 'multiple-votes' : 'one-vote',
      requiresRegistration: election.require_voter_registration,
      creatorId: election.creator_id,
      createdAt: election.created_at,
      voteCount: election.vote_count,
      status: election.status,
      votes: [] // We'll fetch votes separately if needed
    }))

    return NextResponse.json(transformedElections)

  } catch (error) {
    console.error('Elections fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
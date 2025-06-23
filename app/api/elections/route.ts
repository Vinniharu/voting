import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

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
    console.log('🚀 Starting election creation...')
    
    // Use service role client to bypass RLS completely
    const supabase = createServiceRoleClient()
    
    const body = await request.json()
    console.log('📝 Received election data:', JSON.stringify(body, null, 2))
    
    const {
      title,
      description,
      candidates,
    } = body

    // Validate required fields
    if (!title || !description || !candidates) {
      console.log('❌ Missing required fields:', { 
        hasTitle: !!title, 
        hasDescription: !!description, 
        hasCandidates: !!candidates 
      })
      return NextResponse.json(
        { error: 'Title, description, and candidates are required' },
        { status: 400 }
      )
    }

    // Validate candidates
    if (!Array.isArray(candidates) || candidates.length < 2) {
      console.log('❌ Invalid candidates array:', {
        isArray: Array.isArray(candidates),
        length: candidates?.length
      })
      return NextResponse.json(
        { error: 'At least 2 candidates are required' },
        { status: 400 }
      )
    }

    // Validate that candidates have names
    const validCandidates = candidates.filter(candidate => {
      const name = candidate.name || candidate
      return name && typeof name === 'string' && name.trim().length > 0
    })

    console.log('📊 Candidate validation:', {
      original: candidates.length,
      valid: validCandidates.length,
      candidates: validCandidates
    })

    if (validCandidates.length < 2) {
      console.log('❌ Not enough valid candidates')
      return NextResponse.json(
        { error: 'At least 2 candidates with valid names are required' },
        { status: 400 }
      )
    }

    // Set default dates (start now, end in 7 days)
    const startDate = new Date().toISOString()
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    console.log('📅 Setting dates:', { startDate, endDate })
    console.log('💾 Creating election in database with service role...')

    // Create election in database using service role (bypasses all RLS)
    // Use null for creator_id to avoid foreign key constraint
    const { data: election, error: insertError } = await supabase
      .from('elections')
      .insert({
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        allow_multiple_votes: false,
        require_voter_registration: false,
        status: 'active',
        is_public: true,
        creator_id: null // Explicitly set to null
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Election creation error:', insertError)
      return NextResponse.json(
        { error: `Failed to create election: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Election created:', election.id)

    // Insert candidates
    const candidateInserts = candidates.map((candidate: any) => ({
      name: candidate.name || candidate,
      election_id: election.id,
      description: candidate.description || ''
    }))

    console.log('👥 Inserting candidates:', candidateInserts)

    const { error: candidatesError } = await supabase
      .from('candidates')
      .insert(candidateInserts)

    if (candidatesError) {
      console.error('❌ Candidates creation error:', candidatesError)
      // Rollback election if candidates fail
      await supabase.from('elections').delete().eq('id', election.id)
      return NextResponse.json(
        { error: `Failed to create candidates: ${candidatesError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Candidates inserted successfully')

    // Get the created candidates from database
    const { data: createdCandidates, error: fetchCandidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('election_id', election.id)

    if (fetchCandidatesError) {
      console.error('⚠️ Error fetching candidates:', fetchCandidatesError)
    }

    console.log('📋 Fetched candidates:', createdCandidates)

    // Return the created election
    const response = {
      id: election.id,
      title: election.title,
      description: election.description,
      startDate: election.start_date,
      endDate: election.end_date,
      candidates: createdCandidates || [],
      votingPolicy: 'one-vote',
      requiresRegistration: false,
      creatorId: election.creator_id || null,
      createdAt: election.created_at,
      voteCount: election.vote_count || 0,
      status: election.status
    }

    console.log('🎉 Election creation successful! Returning:', response)
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('💥 Election creation error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS completely
    const supabase = createServiceRoleClient()

    // Get all elections (no authentication required with service role)
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
      votes: []
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
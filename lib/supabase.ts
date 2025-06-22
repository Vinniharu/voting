import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  full_name: string
  email: string
  created_at: string
}

export interface Candidate {
  id: string
  name: string
  description: string
  election_id: string
}

export interface Election {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  allow_multiple_votes: boolean
  require_voter_registration: boolean
  is_public: boolean
  creator_id: string
  created_at: string
  status: 'draft' | 'active' | 'ended'
  vote_count: number
}

export interface Vote {
  id: string
  election_id: string
  candidate_ids: string[]
  voter_email?: string
  created_at: string
} 
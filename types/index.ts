export interface Election {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  allow_multiple_votes: boolean
  require_voter_registration: boolean
  is_public: boolean
  creator_id: string
  created_at: string
  vote_count: number
  status: 'draft' | 'active' | 'ended'
  blockchain_election_hash?: string
  blockchain_created: boolean
  blockchain_tx_hash?: string
  blockchain_validated_count: number
}

export interface ElectionOption {
  id: string
  election_id: string
  title: string
  description?: string
  image_url?: string
  order_index: number
  created_at: string
}

export interface Vote {
  id: string
  election_id: string
  option_id: string
  voter_id?: string // null for anonymous votes
  voter_hash: string // cryptographic hash for verification
  blockchain_tx_hash?: string
  ip_address?: string
  user_agent?: string
  voted_at: string
}

export interface VoterRegistration {
  id: string
  election_id: string
  voter_email: string
  voter_name?: string
  registration_token: string
  is_verified: boolean
  voted: boolean
  registered_at: string
  verified_at?: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'creator' | 'voter'
  organization?: string
  created_at: string
  updated_at: string
}

export interface ElectionResults {
  election_id: string
  option_id: string
  option_title: string
  vote_count: number
  percentage: number
}

export interface CreateElectionData {
  title: string
  description?: string
  start_date: string
  end_date: string
  allow_multiple_votes: boolean
  require_voter_registration: boolean
  candidates: string[]
}

export interface CastVoteData {
  election_id: string
  option_id: string
  voter_name?: string
  voter_email?: string
}

export interface ElectionStats {
  total_votes: number
  total_voters: number
  completion_rate: number
  votes_by_hour: { hour: string; count: number }[]
  votes_by_option: ElectionResults[]
} 
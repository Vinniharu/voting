export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'creator' | 'voter'
          organization: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'creator' | 'voter'
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'creator' | 'voter'
          organization?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      elections: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          allow_multiple_votes: boolean
          require_voter_registration: boolean
          is_public: boolean
          creator_id: string
          created_at: string
          vote_count: number
          status: 'draft' | 'active' | 'ended'
          blockchain_election_hash: string | null
          blockchain_created: boolean
          blockchain_tx_hash: string | null
          blockchain_validated_count: number
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          allow_multiple_votes?: boolean
          require_voter_registration?: boolean
          is_public?: boolean
          creator_id: string
          created_at?: string
          vote_count?: number
          status?: 'draft' | 'active' | 'ended'
          blockchain_election_hash?: string | null
          blockchain_created?: boolean
          blockchain_tx_hash?: string | null
          blockchain_validated_count?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          allow_multiple_votes?: boolean
          require_voter_registration?: boolean
          is_public?: boolean
          creator_id?: string
          created_at?: string
          vote_count?: number
          status?: 'draft' | 'active' | 'ended'
          blockchain_election_hash?: string | null
          blockchain_created?: boolean
          blockchain_tx_hash?: string | null
          blockchain_validated_count?: number
        }
      }
      election_options: {
        Row: {
          id: string
          election_id: string
          title: string
          description: string | null
          image_url: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          election_id: string
          title: string
          description?: string | null
          image_url?: string | null
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          order_index?: number
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          election_id: string
          option_id: string
          voter_id: string | null
          voter_hash: string
          blockchain_tx_hash: string | null
          ip_address: string | null
          user_agent: string | null
          voted_at: string
        }
        Insert: {
          id?: string
          election_id: string
          option_id: string
          voter_id?: string | null
          voter_hash: string
          blockchain_tx_hash?: string | null
          ip_address?: string | null
          user_agent?: string | null
          voted_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          option_id?: string
          voter_id?: string | null
          voter_hash?: string
          blockchain_tx_hash?: string | null
          ip_address?: string | null
          user_agent?: string | null
          voted_at?: string
        }
      }
      voter_registrations: {
        Row: {
          id: string
          election_id: string
          voter_email: string
          voter_name: string | null
          registration_token: string
          is_verified: boolean
          voted: boolean
          registered_at: string
          verified_at: string | null
        }
        Insert: {
          id?: string
          election_id: string
          voter_email: string
          voter_name?: string | null
          registration_token: string
          is_verified?: boolean
          voted?: boolean
          registered_at?: string
          verified_at?: string | null
        }
        Update: {
          id?: string
          election_id?: string
          voter_email?: string
          voter_name?: string | null
          registration_token?: string
          is_verified?: boolean
          voted?: boolean
          registered_at?: string
          verified_at?: string | null
        }
      }
    }
    Views: {
      election_results: {
        Row: {
          election_id: string
          option_id: string
          option_title: string
          vote_count: number
          percentage: number
        }
      }
      election_stats: {
        Row: {
          election_id: string
          total_votes: number
          total_voters: number
          completion_rate: number
        }
      }
    }
    Functions: {
      get_election_results: {
        Args: { election_id: string }
        Returns: {
          option_id: string
          option_title: string
          vote_count: number
          percentage: number
        }[]
      }
      verify_voter_eligibility: {
        Args: { 
          election_id: string
          voter_hash: string 
        }
        Returns: boolean
      }
    }
  }
} 
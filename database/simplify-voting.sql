-- Simplify voting system - Remove all blockchain and complex fields
-- This script removes all unnecessary complexity for basic voting

-- Disable Row Level Security for votes table (allows anonymous voting)
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;

-- Remove all blockchain and complex fields from votes table
ALTER TABLE public.votes DROP COLUMN IF EXISTS vote_hash;
ALTER TABLE public.votes DROP COLUMN IF EXISTS voter_hash;
ALTER TABLE public.votes DROP COLUMN IF EXISTS blockchain_tx_hash;
ALTER TABLE public.votes DROP COLUMN IF EXISTS blockchain_validated;
ALTER TABLE public.votes DROP COLUMN IF EXISTS blockchain_block_number;
ALTER TABLE public.votes DROP COLUMN IF EXISTS blockchain_confirmations;
ALTER TABLE public.votes DROP COLUMN IF EXISTS integrity_verified;
ALTER TABLE public.votes DROP COLUMN IF EXISTS last_integrity_check;
ALTER TABLE public.votes DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.votes DROP COLUMN IF EXISTS user_agent;
ALTER TABLE public.votes DROP COLUMN IF EXISTS validation_errors;

-- Remove blockchain fields from elections table
ALTER TABLE public.elections DROP COLUMN IF EXISTS blockchain_election_hash;
ALTER TABLE public.elections DROP COLUMN IF EXISTS blockchain_created;
ALTER TABLE public.elections DROP COLUMN IF EXISTS blockchain_tx_hash;
ALTER TABLE public.elections DROP COLUMN IF EXISTS blockchain_validated_count;

-- Drop blockchain-related tables entirely
DROP TABLE IF EXISTS public.vote_audit_log CASCADE;
DROP TABLE IF EXISTS public.blockchain_validation_status CASCADE;

-- Drop blockchain-related triggers and functions
DROP TRIGGER IF EXISTS vote_audit_log_trigger ON public.votes;
DROP TRIGGER IF EXISTS update_blockchain_validation_status_trigger ON public.votes;
DROP FUNCTION IF EXISTS public.log_vote_audit_event();
DROP FUNCTION IF EXISTS public.update_blockchain_validation_status();

-- Keep only essential indexes
DROP INDEX IF EXISTS idx_votes_vote_hash;
DROP INDEX IF EXISTS idx_votes_blockchain_validated;
DROP INDEX IF EXISTS idx_votes_blockchain_tx_hash;
DROP INDEX IF EXISTS idx_vote_audit_log_vote_id;
DROP INDEX IF EXISTS idx_vote_audit_log_event_type;
DROP INDEX IF EXISTS idx_blockchain_validation_status_election_id;
DROP INDEX IF EXISTS idx_elections_blockchain_validated;

-- Simplified votes table now only has:
-- - id (UUID primary key)
-- - election_id (UUID foreign key)
-- - candidate_ids (UUID array)
-- - voter_email (TEXT, optional)
-- - created_at (TIMESTAMP)

-- Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_election_voter ON public.votes(election_id, voter_email) WHERE voter_email IS NOT NULL;

-- Show final table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'votes' AND table_schema = 'public'
ORDER BY ordinal_position; 
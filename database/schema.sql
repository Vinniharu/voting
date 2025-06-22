-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Elections table
CREATE TABLE public.elections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  allow_multiple_votes BOOLEAN DEFAULT FALSE,
  require_voter_registration BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vote_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  -- Blockchain validation fields
  blockchain_election_hash TEXT,
  blockchain_created BOOLEAN DEFAULT FALSE,
  blockchain_tx_hash TEXT,
  blockchain_validated_count INTEGER DEFAULT 0
);

-- Candidates table
CREATE TABLE public.candidates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Votes table with blockchain validation
CREATE TABLE public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  candidate_ids UUID[] NOT NULL,
  voter_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Blockchain validation fields
  vote_hash TEXT NOT NULL,
  voter_hash TEXT,
  blockchain_tx_hash TEXT,
  blockchain_validated BOOLEAN DEFAULT FALSE,
  blockchain_block_number INTEGER,
  blockchain_confirmations INTEGER DEFAULT 0,
  integrity_verified BOOLEAN DEFAULT FALSE,
  last_integrity_check TIMESTAMP WITH TIME ZONE,
  -- Additional security fields
  ip_address INET,
  user_agent TEXT,
  validation_errors TEXT[]
);

-- Vote audit log table for tracking all validation events
CREATE TABLE public.vote_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vote_id UUID REFERENCES public.votes(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'blockchain_submitted', 'blockchain_validated', 'integrity_check', 'anomaly_detected')),
  event_data JSONB,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Blockchain validation status table
CREATE TABLE public.blockchain_validation_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  total_votes INTEGER DEFAULT 0,
  validated_votes INTEGER DEFAULT 0,
  pending_validation INTEGER DEFAULT 0,
  invalid_votes INTEGER DEFAULT 0,
  integrity_score INTEGER DEFAULT 100,
  blockchain_synced BOOLEAN DEFAULT FALSE,
  last_sync_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  network_status JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_elections_creator_id ON public.elections(creator_id);
CREATE INDEX idx_elections_status ON public.elections(status);
CREATE INDEX idx_elections_blockchain_validated ON public.elections(blockchain_created);
CREATE INDEX idx_candidates_election_id ON public.candidates(election_id);
CREATE INDEX idx_votes_election_id ON public.votes(election_id);
CREATE INDEX idx_votes_voter_email ON public.votes(voter_email);
CREATE INDEX idx_votes_vote_hash ON public.votes(vote_hash);
CREATE INDEX idx_votes_blockchain_validated ON public.votes(blockchain_validated);
CREATE INDEX idx_votes_blockchain_tx_hash ON public.votes(blockchain_tx_hash);
CREATE INDEX idx_vote_audit_log_vote_id ON public.vote_audit_log(vote_id);
CREATE INDEX idx_vote_audit_log_event_type ON public.vote_audit_log(event_type);
CREATE INDEX idx_blockchain_validation_status_election_id ON public.blockchain_validation_status(election_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_validation_status ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Elections policies
CREATE POLICY "Anyone can view public elections" ON public.elections
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create elections" ON public.elections
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own elections" ON public.elections
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own elections" ON public.elections
  FOR DELETE USING (creator_id = auth.uid());

-- Candidates policies
CREATE POLICY "Anyone can view candidates for public elections" ON public.candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.elections 
      WHERE elections.id = candidates.election_id 
      AND (elections.is_public = true OR elections.creator_id = auth.uid())
    )
  );

CREATE POLICY "Election creators can manage candidates" ON public.candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.elections 
      WHERE elections.id = candidates.election_id 
      AND elections.creator_id = auth.uid()
    )
  );

-- Votes policies
CREATE POLICY "Election creators can view votes for their elections" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.elections 
      WHERE elections.id = votes.election_id 
      AND elections.creator_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit votes to public elections" ON public.votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.elections 
      WHERE elections.id = votes.election_id 
      AND elections.is_public = true
    )
  );

-- Vote audit log policies
CREATE POLICY "Election creators can view audit logs for their elections" ON public.vote_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.votes v
      JOIN public.elections e ON v.election_id = e.id
      WHERE v.id = vote_audit_log.vote_id 
      AND e.creator_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs" ON public.vote_audit_log
  FOR INSERT WITH CHECK (true);

-- Blockchain validation status policies
CREATE POLICY "Election creators can view validation status" ON public.blockchain_validation_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.elections 
      WHERE elections.id = blockchain_validation_status.election_id 
      AND elections.creator_id = auth.uid()
    )
  );

CREATE POLICY "System can manage validation status" ON public.blockchain_validation_status
  FOR ALL WITH CHECK (true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update election status based on dates
CREATE OR REPLACE FUNCTION public.update_election_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date <= NOW() AND NEW.end_date > NOW() THEN
    NEW.status = 'active';
  ELSIF NEW.end_date <= NOW() THEN
    NEW.status = 'ended';
  ELSE
    NEW.status = 'draft';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update election status
CREATE TRIGGER update_election_status_trigger
  BEFORE INSERT OR UPDATE ON public.elections
  FOR EACH ROW EXECUTE FUNCTION public.update_election_status();

-- Function to update vote count when votes are added
CREATE OR REPLACE FUNCTION public.update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.elections 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.election_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.elections 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.election_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vote count
CREATE TRIGGER update_vote_count_trigger
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_vote_count();

-- Function to log vote audit events
CREATE OR REPLACE FUNCTION public.log_vote_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vote_audit_log (vote_id, event_type, event_data, created_by)
    VALUES (NEW.id, 'created', jsonb_build_object(
      'vote_hash', NEW.vote_hash,
      'voter_hash', NEW.voter_hash,
      'candidate_ids', NEW.candidate_ids
    ), 'system');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log blockchain validation events
    IF OLD.blockchain_validated = FALSE AND NEW.blockchain_validated = TRUE THEN
      INSERT INTO public.vote_audit_log (vote_id, event_type, event_data, blockchain_tx_hash, created_by)
      VALUES (NEW.id, 'blockchain_validated', jsonb_build_object(
        'block_number', NEW.blockchain_block_number,
        'confirmations', NEW.blockchain_confirmations
      ), NEW.blockchain_tx_hash, 'system');
    END IF;
    
    -- Log integrity check events
    IF OLD.last_integrity_check IS DISTINCT FROM NEW.last_integrity_check THEN
      INSERT INTO public.vote_audit_log (vote_id, event_type, event_data, created_by)
      VALUES (NEW.id, 'integrity_check', jsonb_build_object(
        'integrity_verified', NEW.integrity_verified,
        'validation_errors', NEW.validation_errors
      ), 'system');
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log vote audit events
CREATE TRIGGER vote_audit_log_trigger
  AFTER INSERT OR UPDATE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.log_vote_audit_event();

-- Function to update blockchain validation status
CREATE OR REPLACE FUNCTION public.update_blockchain_validation_status()
RETURNS TRIGGER AS $$
DECLARE
  election_id_val UUID;
  total_count INTEGER;
  validated_count INTEGER;
  pending_count INTEGER;
  invalid_count INTEGER;
  integrity_score_val INTEGER;
BEGIN
  -- Get election ID from the vote
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    election_id_val := NEW.election_id;
  ELSE
    election_id_val := OLD.election_id;
  END IF;

  -- Calculate vote counts
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN blockchain_validated = TRUE THEN 1 END),
    COUNT(CASE WHEN blockchain_tx_hash IS NOT NULL AND blockchain_validated = FALSE THEN 1 END),
    COUNT(CASE WHEN validation_errors IS NOT NULL AND array_length(validation_errors, 1) > 0 THEN 1 END)
  INTO total_count, validated_count, pending_count, invalid_count
  FROM public.votes 
  WHERE election_id = election_id_val;

  -- Calculate integrity score
  integrity_score_val := CASE 
    WHEN total_count = 0 THEN 100
    ELSE ROUND((validated_count::FLOAT / total_count::FLOAT) * 100)
  END;

  -- Upsert blockchain validation status
  INSERT INTO public.blockchain_validation_status (
    election_id, 
    total_votes, 
    validated_votes, 
    pending_validation, 
    invalid_votes, 
    integrity_score,
    updated_at
  )
  VALUES (
    election_id_val, 
    total_count, 
    validated_count, 
    pending_count, 
    invalid_count, 
    integrity_score_val,
    NOW()
  )
  ON CONFLICT (election_id) 
  DO UPDATE SET
    total_votes = EXCLUDED.total_votes,
    validated_votes = EXCLUDED.validated_votes,
    pending_validation = EXCLUDED.pending_validation,
    invalid_votes = EXCLUDED.invalid_votes,
    integrity_score = EXCLUDED.integrity_score,
    updated_at = EXCLUDED.updated_at;

  -- Update election's blockchain validated count
  UPDATE public.elections 
  SET blockchain_validated_count = validated_count
  WHERE id = election_id_val;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update blockchain validation status
CREATE TRIGGER update_blockchain_validation_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_validation_status();

-- Create unique constraint to prevent duplicate validation status records
ALTER TABLE public.blockchain_validation_status 
ADD CONSTRAINT unique_election_validation_status UNIQUE (election_id); 
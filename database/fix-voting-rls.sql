-- Fix Row Level Security for basic voting functionality
-- This allows anonymous voting while maintaining data integrity

-- Drop the existing restrictive vote insertion policy
DROP POLICY IF EXISTS "Anyone can submit votes to public elections" ON public.votes;

-- Create a more permissive policy for vote insertion
CREATE POLICY "Allow public vote submission" ON public.votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.elections 
      WHERE elections.id = votes.election_id 
      AND elections.is_public = true
      AND elections.status = 'active'
      AND NOW() >= elections.start_date 
      AND NOW() <= elections.end_date
    )
  );

-- Update the vote_hash column to allow NULL values for simpler voting
ALTER TABLE public.votes ALTER COLUMN vote_hash DROP NOT NULL;

-- Make vote_hash optional with a default value
ALTER TABLE public.votes ALTER COLUMN vote_hash SET DEFAULT '';

-- Create an index for better performance on public elections
CREATE INDEX IF NOT EXISTS idx_elections_public_active ON public.elections(is_public, status) 
WHERE is_public = true AND status = 'active'; 
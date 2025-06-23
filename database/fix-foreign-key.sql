-- Fix the foreign key constraint issue by making creator_id nullable
-- This allows elections to be created without requiring a valid user

-- Make creator_id nullable
ALTER TABLE public.elections ALTER COLUMN creator_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'elections' 
AND column_name = 'creator_id'; 
-- Create a default system user for elections without authentication
-- This allows elections to be created without requiring user authentication

INSERT INTO public.users (id, full_name, email, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'System User',
  'system@votingapp.local',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT id, full_name, email FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000'; 
-- Fix label_templates to work with WordPress authentication
-- Change user_id from UUID (Supabase auth) to TEXT (WordPress user ID)

-- First, drop all RLS policies that depend on user_id column
DROP POLICY IF EXISTS "Users can view their own templates" ON public.label_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.label_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.label_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.label_templates;

-- Disable RLS temporarily
ALTER TABLE public.label_templates DISABLE ROW LEVEL SECURITY;

-- Drop existing foreign key constraint
ALTER TABLE public.label_templates 
DROP CONSTRAINT IF EXISTS label_templates_user_id_fkey;

-- Change user_id column type to TEXT to store WordPress user IDs
ALTER TABLE public.label_templates 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Add a comment for future reference
COMMENT ON COLUMN public.label_templates.user_id IS 'WordPress user ID (string) instead of Supabase auth UUID';

-- Note: RLS is now disabled. Templates are accessible by all authenticated users.
-- This works with WordPress authentication where user.id comes from WordPress, not Supabase Auth.

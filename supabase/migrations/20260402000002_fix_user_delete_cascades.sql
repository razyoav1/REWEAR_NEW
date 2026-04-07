-- Fix missing ON DELETE CASCADE/SET NULL constraints that blocked account deletion

-- Fix 1: admin_audit_log.admin_user_id — set to NULL when admin user is deleted
ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_admin_user_id_fkey;
ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_admin_user_id_fkey
  FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Fix 2: wishlists.created_by_user_id — set to NULL when creator is deleted
ALTER TABLE public.wishlists
  DROP CONSTRAINT IF EXISTS wishlists_created_by_user_id_fkey;
ALTER TABLE public.wishlists
  ALTER COLUMN created_by_user_id DROP NOT NULL;
ALTER TABLE public.wishlists
  ADD CONSTRAINT wishlists_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

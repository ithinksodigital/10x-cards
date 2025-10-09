-- Migration: Disable All RLS Policies
-- Purpose: Remove all RLS policies from profiles, sets, cards, generations, and generation_error_logs
-- Affected: All application tables
-- Special Considerations:
--   - RLS remains ENABLED on tables (alter table disable row level security to fully disable)
--   - This removes policy enforcement while keeping RLS infrastructure
--   - Useful for development or if using application-level authorization instead

-- ============================================================
-- DROP POLICIES FROM PROFILES TABLE
-- ============================================================

-- drop all policies from profiles table
drop policy if exists profiles_select_own on profiles;
drop policy if exists profiles_select_anon on profiles;
drop policy if exists profiles_insert_own on profiles;
drop policy if exists profiles_update_own on profiles;
drop policy if exists profiles_delete_own on profiles;

-- ============================================================
-- DROP POLICIES FROM SETS TABLE
-- ============================================================

-- drop all policies from sets table
drop policy if exists sets_select_own on sets;
drop policy if exists sets_select_anon on sets;
drop policy if exists sets_insert_own on sets;
drop policy if exists sets_update_own on sets;
drop policy if exists sets_delete_own on sets;

-- ============================================================
-- DROP POLICIES FROM GENERATIONS TABLE
-- ============================================================

-- drop all policies from generations table
drop policy if exists generations_select_own on generations;
drop policy if exists generations_select_anon on generations;
drop policy if exists generations_insert_own on generations;
drop policy if exists generations_update_own on generations;
drop policy if exists generations_delete_own on generations;

-- ============================================================
-- DROP POLICIES FROM GENERATION_ERROR_LOGS TABLE
-- ============================================================

-- drop all policies from generation_error_logs table
drop policy if exists generation_error_logs_select_own on generation_error_logs;
drop policy if exists generation_error_logs_select_anon on generation_error_logs;
drop policy if exists generation_error_logs_insert_own on generation_error_logs;
drop policy if exists generation_error_logs_update_own on generation_error_logs;
drop policy if exists generation_error_logs_delete_own on generation_error_logs;

-- ============================================================
-- DROP POLICIES FROM CARDS TABLE
-- ============================================================

-- drop all policies from cards table
drop policy if exists cards_select_own on cards;
drop policy if exists cards_select_anon on cards;
drop policy if exists cards_insert_own on cards;
drop policy if exists cards_update_own on cards;
drop policy if exists cards_delete_own on cards;

-- ============================================================
-- NOTES
-- ============================================================
-- RLS is still ENABLED on all tables, but with no policies defined,
-- all operations will be DENIED by default (except for superusers).
-- 
-- To fully disable RLS and allow all access:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE sets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
--
-- To re-enable policies, you would need to recreate them or use a rollback migration.


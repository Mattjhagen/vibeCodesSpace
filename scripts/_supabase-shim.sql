-- The parts of Supabase that PGlite does not ship with.
--
-- PGlite is genuine PostgreSQL, so DDL, PL/pgSQL, generated columns and RLS all
-- behave as they will in production. What it is not is Supabase: no `auth`
-- schema, no `auth.uid()`, no `storage` schema, and none of the PostgREST
-- roles. This file creates them the way Supabase defines them so the migrations
-- meet the shape they will actually meet.
--
-- The GRANTS matter as much as the policies. On Supabase, `anon` and
-- `authenticated` hold table privileges and RLS narrows them. Without that, a
-- query would be refused by GRANT rather than by policy — and an RLS test would
-- pass for entirely the wrong reason.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
-- service_role bypasses RLS. That is precisely why the app uses it to write
-- custom-domain verification state and why customers must never hold it.
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT
);

-- Supabase derives this from the request JWT. Reproduced over a session GUC so
-- a test can become a specific user.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
  LANGUAGE sql STABLE
  AS $fn$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $fn$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT
  LANGUAGE sql STABLE
  AS $fn$ SELECT NULLIF(current_setting('request.jwt.claim.role', true), '') $fn$;

-- Supabase Storage, enough for the bucket policies to compile and run.
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public BOOLEAN DEFAULT FALSE,
  file_size_limit BIGINT,
  allowed_mime_types TEXT[]
);
CREATE TABLE storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT REFERENCES storage.buckets(id),
  name TEXT,
  owner UUID
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[]
  LANGUAGE sql IMMUTABLE
  AS $fn$ SELECT string_to_array(name, '/') $fn$;

GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
GRANT SELECT ON auth.users TO anon, authenticated, service_role;
GRANT ALL ON storage.buckets, storage.objects TO anon, authenticated, service_role;

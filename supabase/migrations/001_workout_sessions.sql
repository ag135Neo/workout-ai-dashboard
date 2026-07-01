-- Run this in Supabase SQL editor if you want cloud DB persistence.
-- The app works without this by saving extracted sessions in browser localStorage.

create extension if not exists pgcrypto;

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists workout_sessions_user_date_idx
  on public.workout_sessions (user_id, date);

-- This starter uses the Supabase service role key only on the server, never in the browser.
-- Keep RLS enabled if you later add real auth and user-specific policies.

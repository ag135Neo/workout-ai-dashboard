-- Users table for multi-user workout tracking.
-- Run after 001_workout_sessions.sql.

create table if not exists public.users (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- Seed the default user (Juanita Nidhindra) if not present.
insert into public.users (id, name)
values ('juanita-nidhindra', 'Juanita Nidhindra')
on conflict (id) do nothing;

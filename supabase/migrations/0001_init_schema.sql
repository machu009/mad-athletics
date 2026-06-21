-- 0001_init_schema.sql
-- Core schema for mad-athletics: leagues, divisions, teams, rosters, games, stats
-- A private/independent team has division_id = null and no league at all.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  league_type text not null check (league_type in ('school', 'club')),
  location text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists divisions (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (league_id, name)
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  location text,
  sport text not null,
  division_id uuid references divisions (id) on delete set null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role text not null check (role in ('league_admin', 'coach')),
  created_at timestamptz not null default now(),
  unique (league_id, profile_id)
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role text not null check (role in ('head_coach', 'assistant_coach')),
  created_at timestamptz not null default now(),
  unique (team_id, profile_id)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  full_name text not null,
  jersey_number text,
  position text,
  created_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  opponent_name text not null,
  opponent_team_id uuid references teams (id),
  game_date timestamptz not null,
  location text,
  is_home boolean,
  team_score integer,
  opponent_score integer,
  created_at timestamptz not null default now()
);

-- stats stay flexible (jsonb) since baseball/basketball/soccer all track
-- different things — normalize into per-sport columns later if you need to
-- query/aggregate on specific stat fields at scale.
create table if not exists player_game_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (game_id, player_id)
);

create index if not exists idx_divisions_league on divisions (league_id);
create index if not exists idx_teams_division on teams (division_id);
create index if not exists idx_team_members_profile on team_members (profile_id);
create index if not exists idx_league_members_profile on league_members (profile_id);
create index if not exists idx_players_team on players (team_id);
create index if not exists idx_games_team on games (team_id);
create index if not exists idx_stats_game on player_game_stats (game_id);

-- 0009_sessions_and_rsvp.sql
-- games becomes a real "session" — game or practice. Practices have no
-- opponent or score, so opponent_name drops its not-null constraint.
-- players.profile_id links a roster row to a real account when one
-- exists (set going forward when a join request is accepted), enabling
-- self-RSVP for that player without requiring every player to have one.

alter table games
  add column if not exists session_type text not null default 'game'
    check (session_type in ('game', 'practice'));

alter table games alter column opponent_name drop not null;

alter table players
  add column if not exists profile_id uuid references profiles (id) on delete set null;

create table if not exists session_rsvps (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  status text not null check (status in ('going', 'not_going', 'maybe')),
  updated_at timestamptz not null default now(),
  unique (game_id, player_id)
);

create index if not exists idx_session_rsvps_game on session_rsvps (game_id);

alter table session_rsvps enable row level security;

-- team members (coaches) see every RSVP for their team's sessions
create policy "session_rsvps_select_team_member" on session_rsvps for select
  using (is_team_member((select team_id from games where id = game_id)));

-- coaches can set/change any player's RSVP on their team
create policy "session_rsvps_coach_manage" on session_rsvps for all
  using (is_team_member((select team_id from games where id = game_id)))
  with check (is_team_member((select team_id from games where id = game_id)));

-- a player with a linked account can manage (including read) only their
-- own RSVP row — this also covers their own select, so they don't need
-- to be a team member to see their own status
create policy "session_rsvps_self_manage" on session_rsvps for all
  using (
    exists (
      select 1 from players p
      where p.id = session_rsvps.player_id and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from players p
      where p.id = session_rsvps.player_id and p.profile_id = auth.uid()
    )
  );

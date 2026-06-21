-- 0006_live_scoring.sql
-- game_events is the audit trail every live tap writes to. The two
-- increment_* functions are NOT security definer on purpose — they run as
-- the calling user, so the existing RLS policies on games and
-- player_game_stats (is_team_member checks) apply automatically to the
-- UPDATE/UPSERT inside them. An unauthorized caller's update just silently
-- affects zero rows, the normal RLS behavior — no separate auth check
-- needed here, unlike create_team()/create_league() which do need their
-- own checks since they're inserting brand new rows.

create table if not exists game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  player_id uuid references players (id) on delete set null,
  is_our_team boolean not null,
  stat_key text not null,
  value numeric not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_events_game on game_events (game_id);

alter table game_events enable row level security;

create policy "game_events_public_select" on game_events for select using (true);

create policy "game_events_write_team_member" on game_events for all
  using (is_team_member((select team_id from games where id = game_id)))
  with check (is_team_member((select team_id from games where id = game_id)));

create or replace function increment_game_score(
  p_game_id uuid,
  p_our_amount integer,
  p_opponent_amount integer
)
returns void
language plpgsql
as $$
begin
  update games
  set
    team_score = coalesce(team_score, 0) + p_our_amount,
    opponent_score = coalesce(opponent_score, 0) + p_opponent_amount
  where id = p_game_id;
end;
$$;

create or replace function increment_player_stat(
  p_game_id uuid,
  p_player_id uuid,
  p_stat_key text,
  p_amount numeric
)
returns void
language plpgsql
as $$
begin
  insert into player_game_stats (game_id, player_id, stats)
  values (p_game_id, p_player_id, jsonb_build_object(p_stat_key, p_amount))
  on conflict (game_id, player_id)
  do update set stats = jsonb_set(
    player_game_stats.stats,
    array[p_stat_key],
    to_jsonb(
      coalesce((player_game_stats.stats->>p_stat_key)::numeric, 0) + p_amount
    )
  );
end;
$$;

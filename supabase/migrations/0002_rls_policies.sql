-- 0002_rls_policies.sql
-- Enable RLS everywhere, add membership-check helpers, then scope policies
-- so reads are public (team pages are public) and writes require membership.

create or replace function is_team_member(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from team_members
    where team_id = p_team_id and profile_id = auth.uid()
  );
$$;

create or replace function is_league_admin(p_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from league_members
    where league_id = p_league_id and profile_id = auth.uid() and role = 'league_admin'
  );
$$;

alter table profiles enable row level security;
alter table leagues enable row level security;
alter table divisions enable row level security;
alter table teams enable row level security;
alter table league_members enable row level security;
alter table team_members enable row level security;
alter table players enable row level security;
alter table games enable row level security;
alter table player_game_stats enable row level security;

-- profiles: a person can only read/write their own profile row
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- public read everywhere a team page needs to render without auth
create policy "leagues_public_select" on leagues for select using (true);
create policy "divisions_public_select" on divisions for select using (true);
create policy "teams_public_select" on teams for select using (true);
create policy "players_public_select" on players for select using (true);
create policy "games_public_select" on games for select using (true);
create policy "stats_public_select" on player_game_stats for select using (true);

-- membership rows are only visible to other members of that team/league
create policy "league_members_select" on league_members for select
  using (is_league_admin(league_id) or profile_id = auth.uid());
create policy "team_members_select" on team_members for select
  using (is_team_member(team_id) or profile_id = auth.uid());

-- writes scoped to membership — these are the policies that actually matter
create policy "divisions_write_league_admin" on divisions for all
  using (is_league_admin(league_id)) with check (is_league_admin(league_id));

create policy "teams_write_team_member" on teams for update
  using (is_team_member(id));

create policy "players_write_team_member" on players for all
  using (is_team_member(team_id)) with check (is_team_member(team_id));

create policy "games_write_team_member" on games for all
  using (is_team_member(team_id)) with check (is_team_member(team_id));

create policy "stats_write_team_member" on player_game_stats for all
  using (is_team_member((select team_id from games where id = game_id)))
  with check (is_team_member((select team_id from games where id = game_id)));

-- only a head coach can add/remove other coaches on their own team
create policy "team_members_manage_head_coach" on team_members for all
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.profile_id = auth.uid()
        and tm.role = 'head_coach'
    )
  );

create policy "league_members_manage_admin" on league_members for all
  using (is_league_admin(league_id));

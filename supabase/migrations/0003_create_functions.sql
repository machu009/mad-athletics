-- 0003_create_functions.sql
-- security definer RPCs: a coach can't insert into team_members until the
-- team row exists, and can't insert the team without a membership policy
-- letting them. These functions do both inserts atomically as one call
-- from the signup flow (call via supabase.rpc('create_team', {...})).

create or replace function create_team(
  p_name text,
  p_slug text,
  p_location text,
  p_sport text,
  p_division_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  insert into teams (name, slug, location, sport, division_id, created_by)
  values (p_name, p_slug, p_location, p_sport, p_division_id, auth.uid())
  returning id into v_team_id;

  insert into team_members (team_id, profile_id, role)
  values (v_team_id, auth.uid(), 'head_coach');

  return v_team_id;
end;
$$;

create or replace function create_league(
  p_name text,
  p_slug text,
  p_league_type text,
  p_location text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id uuid;
begin
  insert into leagues (name, slug, league_type, location, created_by)
  values (p_name, p_slug, p_league_type, p_location, auth.uid())
  returning id into v_league_id;

  insert into league_members (league_id, profile_id, role)
  values (v_league_id, auth.uid(), 'league_admin');

  return v_league_id;
end;
$$;

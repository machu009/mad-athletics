-- 0010_team_geocoding.sql
-- zip_code + lat/lng are additive — teams.location stays as the
-- free-text display string ("Conyers, GA"). Zip-centroid precision is
-- the privacy mechanism itself: it's never an exact address, so there's
-- nothing to fuzz after the fact.

alter table teams add column if not exists zip_code text;
alter table teams add column if not exists latitude double precision;
alter table teams add column if not exists longitude double precision;

create or replace function create_team(
  p_name text,
  p_slug text,
  p_location text,
  p_sport text,
  p_division_id uuid default null,
  p_is_recruiting boolean default false,
  p_zip_code text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  insert into teams (
    name, slug, location, sport, division_id, is_recruiting,
    zip_code, latitude, longitude, created_by
  )
  values (
    p_name, p_slug, p_location, p_sport, p_division_id, p_is_recruiting,
    p_zip_code, p_latitude, p_longitude, auth.uid()
  )
  returning id into v_team_id;

  insert into team_members (team_id, profile_id, role)
  values (v_team_id, auth.uid(), 'head_coach');

  return v_team_id;
end;
$$;

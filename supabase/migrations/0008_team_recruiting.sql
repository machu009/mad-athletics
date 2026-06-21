-- 0008_team_recruiting.sql
-- A team can mark itself as recruiting. Anyone signed in can then request
-- to join — the request is separate from the actual roster row, so
-- accepting a request creates a real player the same way the coach's
-- own "add player" form does. Declining deletes the request outright
-- (rather than leaving a permanent block) so the person can ask again
-- or try another team; accepted requests stay as a record.

alter table teams add column if not exists is_recruiting boolean not null default false;

create table if not exists join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (team_id, profile_id)
);

create index if not exists idx_join_requests_team on join_requests (team_id);

alter table join_requests enable row level security;

-- a requester sees their own requests; team members see all requests for
-- their team
create policy "join_requests_select" on join_requests for select
  using (profile_id = auth.uid() or is_team_member(team_id));

-- anyone signed in can request to join a team that's actually recruiting
create policy "join_requests_insert" on join_requests for insert
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from teams where id = team_id and is_recruiting = true
    )
  );

-- the requester can withdraw their own pending request
create policy "join_requests_delete_own" on join_requests for delete
  using (profile_id = auth.uid());

-- team members can accept/decline (update status, or delete on decline)
create policy "join_requests_manage_team_member" on join_requests for all
  using (is_team_member(team_id))
  with check (is_team_member(team_id));

create or replace function create_team(
  p_name text,
  p_slug text,
  p_location text,
  p_sport text,
  p_division_id uuid default null,
  p_is_recruiting boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  insert into teams (name, slug, location, sport, division_id, is_recruiting, created_by)
  values (p_name, p_slug, p_location, p_sport, p_division_id, p_is_recruiting, auth.uid())
  returning id into v_team_id;

  insert into team_members (team_id, profile_id, role)
  values (v_team_id, auth.uid(), 'head_coach');

  return v_team_id;
end;
$$;

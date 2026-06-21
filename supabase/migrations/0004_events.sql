-- 0004_events.sql
-- Events: hosted by a league (official tournament), a team (open invite),
-- or neither (a fully independent pickup-style event created by one person).
-- Registrations: a team registers as a unit, or a lone person registers
-- individually — never both on the same row. Each event decides which
-- kinds of registration it accepts via the two allow_* flags.

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues (id) on delete cascade,
  host_team_id uuid references teams (id) on delete cascade,
  created_by uuid not null references profiles (id),
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  registration_deadline timestamptz,
  capacity integer,
  allow_individual_signup boolean not null default true,
  allow_team_signup boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  team_id uuid references teams (id) on delete cascade,
  profile_id uuid references profiles (id) on delete cascade,
  status text not null default 'registered'
    check (status in ('registered', 'waitlisted', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint one_registrant_type check (
    (team_id is not null and profile_id is null)
    or (team_id is null and profile_id is not null)
  ),
  unique (event_id, team_id),
  unique (event_id, profile_id)
);

create index if not exists idx_events_league on events (league_id);
create index if not exists idx_events_host_team on events (host_team_id);
create index if not exists idx_event_registrations_event on event_registrations (event_id);

alter table events enable row level security;
alter table event_registrations enable row level security;

-- anyone can browse events and see who's registered, signed in or not
create policy "events_public_select" on events for select using (true);
create policy "event_registrations_public_select" on event_registrations
  for select using (true);

-- creating/editing/deleting an event requires being the relevant authority:
-- league admin if it's a league event, team member if a team is hosting,
-- or just the creator themselves for a fully independent event
create policy "events_write" on events for all
  using (
    (league_id is not null and is_league_admin(league_id))
    or (host_team_id is not null and is_team_member(host_team_id))
    or (league_id is null and host_team_id is null and created_by = auth.uid())
  )
  with check (
    (league_id is not null and is_league_admin(league_id))
    or (host_team_id is not null and is_team_member(host_team_id))
    or (league_id is null and host_team_id is null and created_by = auth.uid())
  );

-- self-registration: a person signs themselves up, or a team member signs
-- their own team up
create policy "event_registrations_self_signup" on event_registrations
  for insert
  with check (
    (profile_id = auth.uid() and team_id is null)
    or (team_id is not null and is_team_member(team_id))
  );

-- a person can cancel their own registration, or a team member can cancel
-- their team's
create policy "event_registrations_self_cancel" on event_registrations
  for delete
  using (
    profile_id = auth.uid()
    or (team_id is not null and is_team_member(team_id))
  );

-- the event's organizer can manage any registration on it — move someone
-- to waitlisted, remove a no-show, etc.
create policy "event_registrations_organizer_manage" on event_registrations
  for all
  using (
    exists (
      select 1 from events e
      where e.id = event_registrations.event_id
        and (
          (e.league_id is not null and is_league_admin(e.league_id))
          or (e.host_team_id is not null and is_team_member(e.host_team_id))
          or (
            e.league_id is null
            and e.host_team_id is null
            and e.created_by = auth.uid()
          )
        )
    )
  );

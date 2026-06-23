-- 0012_sport_interests.sql
-- A user can flag interest in a sport with an optional zip code, same
-- privacy posture as team locations: general area, never an address.
-- Public select is intentional — this is meant to be a demand signal a
-- coach could eventually see (e.g. "people interested in basketball near
-- 30094"), symmetric with teams already being publicly visible.

create table if not exists sport_interests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  sport text not null,
  zip_code text,
  created_at timestamptz not null default now(),
  unique (profile_id, sport)
);

create index if not exists idx_sport_interests_sport on sport_interests (sport);

alter table sport_interests enable row level security;

create policy "sport_interests_public_select" on sport_interests
  for select using (true);

create policy "sport_interests_manage_own" on sport_interests for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

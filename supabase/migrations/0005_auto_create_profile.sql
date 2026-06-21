-- 0005_auto_create_profile.sql
-- Without this, create_team(), create_league(), and event registration all
-- fail with a foreign key violation the first time a brand new user tries
-- to use them — team_members.profile_id, league_members.profile_id, and
-- event_registrations.profile_id all require a row in profiles to exist
-- first, and nothing was ever creating one.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Backfill anyone who signed up before this trigger existed (this covers
-- your own test account from earlier sign-in testing).
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

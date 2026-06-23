-- 0014_team_delete.sql
-- Allows a head coach to delete their own team. Two existing foreign
-- keys needed fixing first:
--
-- games.opponent_team_id had no ON DELETE clause at all, which defaults
-- to RESTRICT — if your team was ever set as someone else's opponent,
-- deleting it would fail outright with a foreign key violation.
--
-- events.host_team_id was ON DELETE CASCADE — deleting a team would
-- also delete every event it hosted, and everyone's registrations to
-- those events, even though that data has nothing to do with the
-- decision to delete the team.
--
-- Both now SET NULL instead: the team's own games/roster/stats are
-- gone (that's the point of deleting it), but anything just pointing
-- AT the team from outside survives, minus the now-meaningless
-- reference. Constraint names are looked up dynamically rather than
-- guessed, since getting this wrong would leave the old RESTRICT/
-- CASCADE behavior silently in place alongside the new one.

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'games'::regclass
      and confrelid = 'teams'::regclass
      and pg_get_constraintdef(oid) like '%opponent_team_id%'
  loop
    execute format('alter table games drop constraint %I', con.conname);
  end loop;
end $$;

alter table games add constraint games_opponent_team_id_fkey
  foreign key (opponent_team_id) references teams (id) on delete set null;

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'events'::regclass
      and confrelid = 'teams'::regclass
      and pg_get_constraintdef(oid) like '%host_team_id%'
  loop
    execute format('alter table events drop constraint %I', con.conname);
  end loop;
end $$;

alter table events add constraint events_host_team_id_fkey
  foreign key (host_team_id) references teams (id) on delete set null;

create policy "teams_delete_head_coach" on teams for delete
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = teams.id
        and tm.profile_id = auth.uid()
        and tm.role = 'head_coach'
    )
  );

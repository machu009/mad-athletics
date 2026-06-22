-- 0011_team_members_and_profiles.sql
-- Self-leave: the existing head_coach-only policy governs managing OTHER
-- members; this adds the case of removing your own membership, which
-- should work regardless of role.

create policy "team_members_leave_own" on team_members for delete
  using (profile_id = auth.uid());

-- Without this, a head coach trying to display another coach's name
-- would get nothing back — profiles RLS otherwise only allows reading
-- your own row. Scoped narrowly: visible only to people who share at
-- least one team in common, not a general "see everyone" policy.
create policy "profiles_select_teammates" on profiles for select
  using (
    exists (
      select 1 from team_members tm1
      join team_members tm2 on tm1.team_id = tm2.team_id
      where tm1.profile_id = auth.uid() and tm2.profile_id = profiles.id
    )
  );

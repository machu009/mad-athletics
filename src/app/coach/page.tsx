import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type TeamRow = {
  role: string;
  team: {
    id: string;
    name: string;
    slug: string;
    sport: string;
    location: string | null;
  };
};

type LeagueRow = {
  role: string;
  league: {
    id: string;
    name: string;
    slug: string;
    league_type: string;
  };
};

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in?next=/coach');
  }

  const { data: teamMemberships } = await supabase
    .from('team_members')
    .select('role, teams(id, name, slug, sport, location)')
    .eq('profile_id', user.id);

  const { data: leagueMemberships } = await supabase
    .from('league_members')
    .select('role, leagues(id, name, slug, league_type)')
    .eq('profile_id', user.id);

  const teams = (teamMemberships ?? [])
    .map((m) => ({ role: m.role, team: m.teams }))
    .filter((m) => m.team) as unknown as TeamRow[];

  const leagues = (leagueMemberships ?? [])
    .map((m) => ({ role: m.role, league: m.leagues }))
    .filter((m) => m.league) as unknown as LeagueRow[];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Your teams
        </h1>
        <Link
          href="/coach/new"
          className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
        >
          + New team
        </Link>
      </div>

      <div className="mt-6 space-y-2">
        {!teams.length ? (
          <p className="text-sm text-[#9AA1B5]">
            You&apos;re not coaching any teams yet.
          </p>
        ) : (
          teams.map(({ role, team }) => (
            <div
              key={team.id}
              className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3"
            >
              <div>
                <p className="text-sm">{team.name}</p>
                <p className="text-xs text-[#9AA1B5]">
                  {team.sport}
                  {team.location ? ` · ${team.location}` : ''}
                  {role === 'head_coach' ? ' · Head coach' : ' · Assistant coach'}
                </p>
              </div>
              <div className="flex gap-4">
                <Link
                  href={`/${team.slug}`}
                  className="text-sm text-[#F2A93B] hover:underline"
                >
                  View
                </Link>
                <Link
                  href={`/${team.slug}/manage`}
                  className="text-sm text-[#F2A93B] hover:underline"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {leagues.length > 0 && (
        <div className="mt-10">
          <h2
            className="text-sm tracking-[0.16em] text-[#9AA1B5]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            YOUR LEAGUES
          </h2>
          <div className="mt-3 space-y-2">
            {leagues.map(({ role, league }) => (
              <div
                key={league.id}
                className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3"
              >
                <div>
                  <p className="text-sm">{league.name}</p>
                  <p className="text-xs text-[#9AA1B5]">
                    {league.league_type === 'school'
                      ? 'School league'
                      : 'Club league'}
                    {role === 'league_admin' ? ' · Admin' : ''}
                  </p>
                </div>
                <Link
                  href={`/leagues/${league.slug}`}
                  className="text-sm text-[#F2A93B] hover:underline"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

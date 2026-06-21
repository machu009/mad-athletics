import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSportTemplate } from '@/lib/sports';

async function getTeamRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  lowerScoreWins: boolean
) {
  const { data: games } = await supabase
    .from('games')
    .select('team_score, opponent_score')
    .eq('team_id', teamId)
    .not('team_score', 'is', null)
    .not('opponent_score', 'is', null);

  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const g of games ?? []) {
    if (g.team_score === g.opponent_score) {
      ties++;
    } else if (
      lowerScoreWins
        ? g.team_score! < g.opponent_score!
        : g.team_score! > g.opponent_score!
    ) {
      wins++;
    } else {
      losses++;
    }
  }
  return { wins, losses, ties };
}

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ league: string }>;
}) {
  const { league: slug } = await params;
  const supabase = await createClient();

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, league_type, location')
    .eq('slug', slug)
    .single();

  if (!league) {
    notFound();
  }

  const { data: divisions } = await supabase
    .from('divisions')
    .select('id, name')
    .eq('league_id', league.id)
    .order('name', { ascending: true });

  const divisionsWithTeams = await Promise.all(
    (divisions ?? []).map(async (division) => {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, slug, sport')
        .eq('division_id', division.id)
        .order('name', { ascending: true });

      const teamsWithRecord = await Promise.all(
        (teams ?? []).map(async (team) => {
          const { lowerScoreWins } = getSportTemplate(team.sport);
          const record = await getTeamRecord(
            supabase,
            team.id,
            !!lowerScoreWins
          );
          return { ...team, record };
        })
      );

      teamsWithRecord.sort((a, b) => {
        const aTotal = a.record.wins + a.record.losses + a.record.ties;
        const bTotal = b.record.wins + b.record.losses + b.record.ties;
        const aPct = aTotal > 0 ? a.record.wins / aTotal : 0;
        const bPct = bTotal > 0 ? b.record.wins / bTotal : 0;
        return bPct - aPct;
      });

      return { ...division, teams: teamsWithRecord };
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p
        className="text-xs tracking-[0.16em] text-[#F2A93B]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {league.league_type.toUpperCase()} LEAGUE
      </p>
      <h1
        className="mt-1 text-2xl font-semibold sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {league.name}
      </h1>
      {league.location && (
        <p className="mt-1 text-sm text-[#9AA1B5]">{league.location}</p>
      )}

      <div className="mt-10 space-y-10">
        {!divisionsWithTeams.length ? (
          <p className="text-sm text-[#9AA1B5]">No divisions yet.</p>
        ) : (
          divisionsWithTeams.map((division) => (
            <div key={division.id}>
              <h2
                className="text-lg font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {division.name}
              </h2>
              {!division.teams.length ? (
                <p className="mt-2 text-sm text-[#9AA1B5]">No teams yet.</p>
              ) : (
                <div className="mt-3 overflow-hidden rounded-lg border border-[#2A3550]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#2A3550] text-xs tracking-[0.12em] text-[#9AA1B5]">
                        <th className="px-4 py-3 font-normal">Team</th>
                        <th className="px-4 py-3 font-normal">W</th>
                        <th className="px-4 py-3 font-normal">L</th>
                        <th className="px-4 py-3 font-normal">T</th>
                      </tr>
                    </thead>
                    <tbody>
                      {division.teams.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-[#2A3550] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/${t.slug}`}
                              className="hover:text-[#F2A93B]"
                            >
                              {t.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-[#9AA1B5]">
                            {t.record.wins}
                          </td>
                          <td className="px-4 py-3 text-[#9AA1B5]">
                            {t.record.losses}
                          </td>
                          <td className="px-4 py-3 text-[#9AA1B5]">
                            {t.record.ties}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

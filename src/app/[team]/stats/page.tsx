import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import { getSportTemplate } from '@/lib/sports';

type PlayerAgg = {
  name: string;
  jersey: string | null;
  games: number;
  totals: Record<string, number>;
};

export default async function StatsPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const template = getSportTemplate(team.sport);
  const supabase = await createClient();

  const { data: games } = await supabase
    .from('games')
    .select('id')
    .eq('team_id', team.id);

  const gameIds = (games ?? []).map((g) => g.id);

  const { data: statRows } = gameIds.length
    ? await supabase
        .from('player_game_stats')
        .select('player_id, stats, players(full_name, jersey_number)')
        .in('game_id', gameIds)
    : { data: [] as Array<Record<string, unknown>> };

  const byPlayer = new Map<string, PlayerAgg>();

  for (const row of statRows ?? []) {
    const player = row.players as unknown as {
      full_name: string;
      jersey_number: string | null;
    } | null;
    if (!player) continue;

    const playerId = row.player_id as string;
    const existing: PlayerAgg = byPlayer.get(playerId) ?? {
      name: player.full_name,
      jersey: player.jersey_number,
      games: 0,
      totals: {},
    };

    existing.games += 1;
    const stats = (row.stats ?? {}) as Record<string, number>;
    for (const field of template.statFields) {
      existing.totals[field.key] =
        (existing.totals[field.key] ?? 0) + (stats[field.key] ?? 0);
    }

    byPlayer.set(playerId, existing);
  }

  const rows = Array.from(byPlayer.values());
  const derivedFields = template.derivedFields ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      {!template.statFields.length ? (
        <p className="text-sm text-[#9AA1B5]">
          Stat tracking for {team.sport} isn&apos;t set up yet.
        </p>
      ) : !rows.length ? (
        <p className="text-sm text-[#9AA1B5]">No stats logged yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#2A3550]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2A3550] text-xs tracking-[0.12em] text-[#9AA1B5]">
                <th className="px-4 py-3 font-normal">Player</th>
                <th className="px-4 py-3 font-normal">GP</th>
                {template.statFields.map((f) => (
                  <th key={f.key} className="px-4 py-3 font-normal">
                    {f.label}
                  </th>
                ))}
                {derivedFields.map((f) => (
                  <th key={f.key} className="px-4 py-3 font-normal">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className="border-b border-[#2A3550] last:border-0"
                >
                  <td className="px-4 py-3">
                    {r.jersey ? (
                      <span className="text-[#9AA1B5]">#{r.jersey} </span>
                    ) : null}
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-[#9AA1B5]">{r.games}</td>
                  {template.statFields.map((f) => {
                    const total = r.totals[f.key] ?? 0;
                    const value =
                      f.aggregate === 'avg' && r.games > 0
                        ? total / r.games
                        : total;
                    return (
                      <td key={f.key} className="px-4 py-3">
                        {f.decimals != null
                          ? value.toFixed(f.decimals)
                          : Math.round(value)}
                      </td>
                    );
                  })}
                  {derivedFields.map((f) => (
                    <td key={f.key} className="px-4 py-3 text-[#9AA1B5]">
                      {f.compute(r.totals, r.games).toFixed(f.decimals)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

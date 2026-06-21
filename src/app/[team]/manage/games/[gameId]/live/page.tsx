import { notFound } from 'next/navigation';
import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import { getSportTemplate } from '@/lib/sports';
import LiveGamePanel from './live-game-panel';

export default async function LiveGamePage({
  params,
}: {
  params: Promise<{ team: string; gameId: string }>;
}) {
  const { team: slug, gameId } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const supabase = await createClient();

  const { data: game } = await supabase
    .from('games')
    .select('id, opponent_name, is_home, team_score, opponent_score')
    .eq('id', gameId)
    .eq('team_id', team.id)
    .single();

  if (!game) {
    notFound();
  }

  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, jersey_number')
    .eq('team_id', team.id)
    .order('jersey_number', { ascending: true, nullsFirst: false });

  const { data: recentEvents } = await supabase
    .from('game_events')
    .select(
      'id, player_id, is_our_team, stat_key, value, created_at, players(full_name)'
    )
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(20);

  const template = getSportTemplate(team.sport);

  if (!template.quickActions?.length) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-[#9AA1B5]">
          Live tracking isn&apos;t available for {team.sport} yet. Use Log
          result to enter the final stats instead.
        </p>
      </div>
    );
  }

  return (
    <LiveGamePanel
      gameId={game.id}
      opponentName={game.opponent_name}
      initialTeamScore={game.team_score ?? 0}
      initialOpponentScore={game.opponent_score ?? 0}
      players={players ?? []}
      quickActions={template.quickActions}
      initialEvents={(recentEvents ?? []).map((e) => ({
        id: e.id,
        playerName:
          (e.players as unknown as { full_name: string } | null)
            ?.full_name ?? null,
        isOurTeam: e.is_our_team,
        statKey: e.stat_key,
        value: e.value as number,
      }))}
    />
  );
}

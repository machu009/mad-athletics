import { notFound } from 'next/navigation';
import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import { getSportTemplate } from '@/lib/sports';
import LogGameForm from './log-game-form';

export default async function LogGamePage({
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
    .select('id, opponent_name, game_date, is_home, team_score, opponent_score')
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

  const { data: existingStats } = await supabase
    .from('player_game_stats')
    .select('player_id, stats')
    .eq('game_id', gameId);

  const template = getSportTemplate(team.sport);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {game.is_home ? 'vs' : '@'} {game.opponent_name}
      </h1>
      <p className="mt-1 text-sm text-[#9AA1B5]">
        {new Date(game.game_date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>

      <LogGameForm
        gameId={game.id}
        initialTeamScore={game.team_score}
        initialOpponentScore={game.opponent_score}
        players={players ?? []}
        statFields={template.statFields}
        existingStats={
          (existingStats ?? []) as Array<{
            player_id: string;
            stats: Record<string, number>;
          }>
        }
      />
    </div>
  );
}

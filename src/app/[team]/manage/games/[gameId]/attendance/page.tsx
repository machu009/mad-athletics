import { notFound } from 'next/navigation';
import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import AttendancePanel from './attendance-panel';

export default async function AttendancePage({
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
    .select('id, opponent_name, game_date, session_type, is_home')
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

  const { data: rsvps } = await supabase
    .from('session_rsvps')
    .select('player_id, status')
    .eq('game_id', gameId);

  const rsvpMap: Record<string, string> = {};
  for (const r of rsvps ?? []) {
    rsvpMap[r.player_id] = r.status;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {game.session_type === 'practice'
          ? 'Practice'
          : `${game.is_home ? 'vs' : '@'} ${game.opponent_name}`}
      </h1>
      <p className="mt-1 text-sm text-[#9AA1B5]">
        {new Date(game.game_date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>

      <AttendancePanel
        gameId={game.id}
        players={players ?? []}
        initialRsvps={rsvpMap}
      />
    </div>
  );
}

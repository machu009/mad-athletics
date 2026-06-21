import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import ScheduleManager from './schedule-manager';

export default async function ManageSchedulePage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const supabase = await createClient();
  const { data: games } = await supabase
    .from('games')
    .select(
      'id, opponent_name, game_date, location, is_home, team_score, opponent_score'
    )
    .eq('team_id', team.id)
    .order('game_date', { ascending: false });

  return (
    <ScheduleManager
      teamId={team.id}
      teamSlug={slug}
      initialGames={games ?? []}
    />
  );
}

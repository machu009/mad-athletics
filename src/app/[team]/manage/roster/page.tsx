import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import RosterManager from './roster-manager';

export default async function ManageRosterPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const supabase = await createClient();
  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, jersey_number, position')
    .eq('team_id', team.id)
    .order('jersey_number', { ascending: true, nullsFirst: false });

  return <RosterManager teamId={team.id} initialPlayers={players ?? []} />;
}

import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import RosterManager from './roster-manager';
import JoinRequestsPanel from './join-requests-panel';

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

  const { data: requests } = await supabase
    .from('join_requests')
    .select('id, message, profile_id, profiles(full_name)')
    .eq('team_id', team.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-8">
      <JoinRequestsPanel
        teamId={team.id}
        initialRequests={(requests ?? []).map((r) => ({
          id: r.id,
          message: r.message,
          profileId: r.profile_id,
          name:
            (r.profiles as unknown as { full_name: string } | null)
              ?.full_name ?? 'Someone',
        }))}
      />
      <RosterManager
        teamId={team.id}
        initialPlayers={players ?? []}
        initialIsRecruiting={team.is_recruiting}
      />
    </div>
  );
}

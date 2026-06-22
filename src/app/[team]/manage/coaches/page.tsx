import { getTeamBySlug } from '@/lib/teams';
import { getMembership } from '@/lib/membership';
import { createClient } from '@/lib/supabase/server';
import CoachesPanel from './coaches-panel';

export default async function ManageCoachesPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: members } = await supabase
    .from('team_members')
    .select('profile_id, role, profiles(full_name, email)')
    .eq('team_id', team.id);

  const myMembership = await getMembership(team.id);

  return (
    <div>
      <h2
        className="text-sm tracking-[0.16em] text-[#9AA1B5]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        COACHES
      </h2>
      <CoachesPanel
        teamId={team.id}
        currentUserId={user?.id ?? ''}
        isHeadCoach={myMembership?.role === 'head_coach'}
        initialMembers={(members ?? []).map((m) => {
          const profile = m.profiles as unknown as {
            full_name: string | null;
            email: string;
          } | null;
          return {
            profileId: m.profile_id,
            role: m.role,
            name: profile?.full_name ?? profile?.email ?? 'Unknown',
          };
        })}
      />
    </div>
  );
}

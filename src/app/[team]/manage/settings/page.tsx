import { getTeamBySlug } from '@/lib/teams';
import { getMembership } from '@/lib/membership';
import TeamSettingsForm from './team-settings-form';
import DeleteTeamSection from './delete-team-section';

export default async function ManageSettingsPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const membership = await getMembership(team.id);

  return (
    <div>
      <h2
        className="text-sm tracking-[0.16em] text-[#9AA1B5]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        TEAM SETTINGS
      </h2>
      <TeamSettingsForm
        teamId={team.id}
        initialName={team.name}
        initialLocation={team.location ?? ''}
        initialZipCode={team.zip_code ?? ''}
        initialSport={team.sport}
      />

      {membership?.role === 'head_coach' && (
        <DeleteTeamSection teamId={team.id} teamName={team.name} />
      )}
    </div>
  );
}

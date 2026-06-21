import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RegisterPanel from './register-panel';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select(
      'id, title, description, event_date, location, capacity, allow_individual_signup, allow_team_signup, host_team_id, teams(name, slug)'
    )
    .eq('id', eventId)
    .single();

  if (!event) {
    notFound();
  }

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select(
      'id, team_id, profile_id, teams(name), profiles(full_name)'
    )
    .eq('event_id', eventId)
    .eq('status', 'registered');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myTeams: Array<{ id: string; name: string }> = [];
  if (user) {
    const { data: memberships } = await supabase
      .from('team_members')
      .select('teams(id, name)')
      .eq('profile_id', user.id);
    myTeams = (memberships ?? [])
      .map((m) => m.teams)
      .filter(Boolean) as unknown as Array<{ id: string; name: string }>;
  }

  const host = event.teams as unknown as {
    name: string;
    slug: string;
  } | null;
  const registeredCount = registrations?.length ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p
        className="text-xs tracking-[0.16em] text-[#F2A93B]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {host ? `HOSTED BY ${host.name.toUpperCase()}` : 'OPEN EVENT'}
      </p>
      <h1
        className="mt-1 text-2xl font-semibold sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {event.title}
      </h1>
      <p className="mt-2 text-sm text-[#9AA1B5]">
        {new Date(event.event_date).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
        {event.location ? ` · ${event.location}` : ''}
      </p>
      {event.description && (
        <p className="mt-4 text-sm text-[#C8CCD8]">{event.description}</p>
      )}

      <RegisterPanel
        eventId={event.id}
        allowIndividual={event.allow_individual_signup}
        allowTeam={event.allow_team_signup}
        capacity={event.capacity}
        registeredCount={registeredCount}
        myTeams={myTeams}
        currentUserId={user?.id ?? null}
        registrations={(registrations ?? []).map((r) => ({
          id: r.id,
          teamId: r.team_id,
          profileId: r.profile_id,
          teamName:
            (r.teams as unknown as { name: string } | null)?.name ?? null,
          profileName:
            (r.profiles as unknown as { full_name: string } | null)
              ?.full_name ?? null,
        }))}
      />
    </div>
  );
}

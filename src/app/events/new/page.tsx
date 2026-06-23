import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewEventForm from './new-event-form';

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = sport ? `/events/new?sport=${sport}` : '/events/new';
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  const { data: memberships } = await supabase
    .from('team_members')
    .select('teams(id, name, slug)')
    .eq('profile_id', user.id);

  const myTeams = (memberships ?? [])
    .map((m) => m.teams)
    .filter(Boolean) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
  }>;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Create an event
      </h1>
      <p className="mt-2 text-sm text-[#9AA1B5]">
        A tournament, a pickup game, anything people can show up for.
      </p>
      <NewEventForm myTeams={myTeams} defaultSport={sport} />
    </div>
  );
}

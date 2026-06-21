import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewTeamForm from './new-team-form';

export default async function NewTeamPage({
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
    const next = sport ? `/coach/new?sport=${sport}` : '/coach/new';
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, slug')
    .order('name', { ascending: true });

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Set up your team
      </h1>
      <p className="mt-2 text-sm text-[#9AA1B5]">
        Takes a minute. You can skip the league for now and add it later.
      </p>
      <NewTeamForm defaultSport={sport} leagues={leagues ?? []} />
    </div>
  );
}

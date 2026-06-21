import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewLeagueForm from './new-league-form';

export default async function NewLeaguePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in?next=/league/new');
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Create a league
      </h1>
      <p className="mt-2 text-sm text-[#9AA1B5]">
        You&apos;ll be the league admin — add divisions and welcome teams in
        from here.
      </p>
      <NewLeagueForm />
    </div>
  );
}

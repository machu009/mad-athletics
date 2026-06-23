import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from './profile-form';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in?next=/profile');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const { data: interests } = await supabase
    .from('sport_interests')
    .select('id, sport, zip_code')
    .eq('profile_id', user.id)
    .order('sport', { ascending: true });

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Your profile
      </h1>
      <ProfileForm
        userId={user.id}
        initialName={profile?.full_name ?? ''}
        email={profile?.email ?? user.email ?? ''}
        initialInterests={interests ?? []}
      />
    </div>
  );
}

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getMembership = cache(async (teamId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('profile_id', user.id)
    .maybeSingle();

  return data ? { userId: user.id, role: data.role as string } : null;
});

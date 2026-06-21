import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getTeamBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('teams')
    .select('id, name, slug, location, sport, is_recruiting')
    .eq('slug', slug)
    .single();

  return data;
});

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function slugify(...parts: string[]) {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewLeagueForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [leagueType, setLeagueType] = useState<'school' | 'club'>('club');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    const slug = slugify(name, location);
    const supabase = createClient();

    const { data: leagueId, error } = await supabase.rpc('create_league', {
      p_name: name,
      p_slug: slug,
      p_league_type: leagueType,
      p_location: location || null,
    });

    if (error || !leagueId) {
      setStatus('error');
      setErrorMsg(
        error?.message.includes('duplicate')
          ? 'That league URL is already taken — try adding more location detail.'
          : 'Something went wrong. Try again.'
      );
      return;
    }

    router.push(`/leagues/${slug}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          LEAGUE NAME
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rockdale Youth Baseball"
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
      </div>

      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          TYPE
        </label>
        <select
          value={leagueType}
          onChange={(e) => setLeagueType(e.target.value as 'school' | 'club')}
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        >
          <option value="club">Club / travel league</option>
          <option value="school">School league</option>
        </select>
      </div>

      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          LOCATION
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Rockdale County, GA"
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full rounded-lg bg-[#F2A93B] px-4 py-3 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
      >
        {status === 'saving' ? 'Creating…' : 'Create league'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-[#D85A30]">{errorMsg}</p>
      )}
    </form>
  );
}

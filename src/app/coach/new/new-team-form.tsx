'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const sports = [
  'Baseball',
  'Softball',
  'Basketball',
  'Soccer',
  'Football',
  'Volleyball',
  'Golf',
];

function slugify(...parts: string[]) {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewTeamForm({
  defaultSport,
}: {
  defaultSport?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [sport, setSport] = useState(
    sports.find((s) => s.toLowerCase() === defaultSport?.toLowerCase()) ??
      sports[0]
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    const slug = slugify(name, location);
    const supabase = createClient();

    const { error } = await supabase.rpc('create_team', {
      p_name: name,
      p_slug: slug,
      p_location: location || null,
      p_sport: sport.toLowerCase(),
    });

    if (error) {
      setStatus('error');
      setErrorMsg(
        error.message.includes('duplicate')
          ? 'That team URL is already taken — try adding more location detail.'
          : 'Something went wrong. Try again.'
      );
      return;
    }

    router.push(`/${slug}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          TEAM NAME
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Granger Lancers"
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
      </div>

      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          SPORT
        </label>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        >
          {sports.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          LOCATION
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Conyers, GA"
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full rounded-lg bg-[#F2A93B] px-4 py-3 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
      >
        {status === 'saving' ? 'Creating…' : 'Create team'}
      </button>

      {status === 'error' && (
        <p className="text-sm text-[#D85A30]">{errorMsg}</p>
      )}
    </form>
  );
}

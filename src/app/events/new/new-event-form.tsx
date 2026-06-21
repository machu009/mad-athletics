'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Team = { id: string; name: string; slug: string };

export default function NewEventForm({ myTeams }: { myTeams: Team[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [hostTeamId, setHostTeamId] = useState('');
  const [allowIndividual, setAllowIndividual] = useState(true);
  const [allowTeam, setAllowTeam] = useState(true);
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('events')
      .insert({
        title,
        description: description || null,
        event_date: new Date(date).toISOString(),
        location: location || null,
        host_team_id: hostTeamId || null,
        created_by: user?.id,
        allow_individual_signup: allowIndividual,
        allow_team_signup: allowTeam,
        capacity: capacity ? Number(capacity) : null,
      })
      .select('id')
      .single();

    if (error || !data) {
      setStatus('error');
      return;
    }

    router.push(`/events/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          TITLE
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Saturday pickup basketball"
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
      </div>

      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          DESCRIPTION
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Open gym, all skill levels welcome"
          rows={3}
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            DATE & TIME
          </label>
          <input
            required
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            CAPACITY
          </label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
      </div>

      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          LOCATION
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Conyers Rec Center"
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
      </div>

      {myTeams.length > 0 && (
        <div>
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            HOSTING TEAM
          </label>
          <select
            value={hostTeamId}
            onChange={(e) => setHostTeamId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          >
            <option value="">No team — open event</option>
            {myTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          WHO CAN REGISTER
        </p>
        <label className="flex items-center gap-2 text-sm text-[#C8CCD8]">
          <input
            type="checkbox"
            checked={allowIndividual}
            onChange={(e) => setAllowIndividual(e.target.checked)}
            className="h-4 w-4 rounded border-[#2A3550] bg-[#141E33] text-[#F2A93B] focus:ring-[#F2A93B]"
          />
          Individuals can sign up solo
        </label>
        <label className="flex items-center gap-2 text-sm text-[#C8CCD8]">
          <input
            type="checkbox"
            checked={allowTeam}
            onChange={(e) => setAllowTeam(e.target.checked)}
            className="h-4 w-4 rounded border-[#2A3550] bg-[#141E33] text-[#F2A93B] focus:ring-[#F2A93B]"
          />
          Whole teams can sign up
        </label>
      </div>

      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full rounded-lg bg-[#F2A93B] px-4 py-3 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
      >
        {status === 'saving' ? 'Creating…' : 'Create event'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-[#D85A30]">
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}

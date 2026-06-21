'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Registration = {
  id: string;
  teamId: string | null;
  profileId: string | null;
  teamName: string | null;
  profileName: string | null;
};

type MyTeam = { id: string; name: string };

export default function RegisterPanel({
  eventId,
  allowIndividual,
  allowTeam,
  capacity,
  registeredCount,
  myTeams,
  currentUserId,
  registrations,
}: {
  eventId: string;
  allowIndividual: boolean;
  allowTeam: boolean;
  capacity: number | null;
  registeredCount: number;
  myTeams: MyTeam[];
  currentUserId: string | null;
  registrations: Registration[];
}) {
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');

  const myIndividualReg = registrations.find(
    (r) => r.profileId === currentUserId
  );
  const myTeamRegs = registrations.filter(
    (r) => r.teamId && myTeams.some((t) => t.id === r.teamId)
  );
  const full = capacity != null && registeredCount >= capacity;

  async function registerSolo() {
    if (!currentUserId) {
      router.push(`/sign-in?next=/events/${eventId}`);
      return;
    }
    setStatus('saving');
    const supabase = createClient();
    await supabase
      .from('event_registrations')
      .insert({ event_id: eventId, profile_id: currentUserId });
    router.refresh();
    setStatus('idle');
  }

  async function registerTeam() {
    if (!selectedTeam) return;
    setStatus('saving');
    const supabase = createClient();
    await supabase
      .from('event_registrations')
      .insert({ event_id: eventId, team_id: selectedTeam });
    router.refresh();
    setStatus('idle');
  }

  async function cancel(registrationId: string) {
    setStatus('saving');
    const supabase = createClient();
    await supabase
      .from('event_registrations')
      .delete()
      .eq('id', registrationId);
    router.refresh();
    setStatus('idle');
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-lg border border-[#2A3550] bg-[#141E33] p-5">
        <p className="text-sm text-[#9AA1B5]">
          {registeredCount} registered
          {capacity != null ? ` of ${capacity}` : ''}
        </p>

        {full ? (
          <p className="mt-3 text-sm text-[#D85A30]">This event is full.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {allowIndividual &&
              (myIndividualReg ? (
                <button
                  onClick={() => cancel(myIndividualReg.id)}
                  disabled={status === 'saving'}
                  className="rounded-lg border border-[#2A3550] px-4 py-2 text-sm text-[#D85A30] hover:bg-[#1B2742] disabled:opacity-50"
                >
                  Cancel my registration
                </button>
              ) : (
                <button
                  onClick={registerSolo}
                  disabled={status === 'saving'}
                  className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] hover:opacity-90 disabled:opacity-50"
                >
                  Register solo
                </button>
              ))}

            {allowTeam && myTeams.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
                >
                  <option value="">Choose a team…</option>
                  {myTeams
                    .filter((t) => !myTeamRegs.some((r) => r.teamId === t.id))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={registerTeam}
                  disabled={!selectedTeam || status === 'saving'}
                  className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] hover:opacity-90 disabled:opacity-50"
                >
                  Register team
                </button>
              </div>
            )}

            {myTeamRegs.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{r.teamName} is registered</span>
                <button
                  onClick={() => cancel(r.id)}
                  disabled={status === 'saving'}
                  className="text-[#D85A30] hover:underline disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {registrations.length > 0 && (
        <div>
          <p
            className="text-xs tracking-[0.16em] text-[#9AA1B5]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            WHO&apos;S COMING
          </p>
          <ul className="mt-3 space-y-1 text-sm text-[#C8CCD8]">
            {registrations.map((r) => (
              <li key={r.id}>{r.teamName ?? r.profileName ?? 'Someone'}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

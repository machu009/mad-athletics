'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Session = {
  id: string;
  opponent_name: string | null;
  game_date: string;
  location: string | null;
  is_home: boolean | null;
  session_type: 'game' | 'practice';
};

const rsvpOptions: Array<{ value: string; label: string }> = [
  { value: 'going', label: 'Going' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'not_going', label: "Can't go" },
];

export default function UpcomingList({
  sessions,
  myPlayerId,
  initialRsvps,
}: {
  sessions: Session[];
  myPlayerId: string | null;
  initialRsvps: Record<string, string>;
}) {
  const [rsvps, setRsvps] = useState(initialRsvps);

  async function setStatus(gameId: string, status: string) {
    if (!myPlayerId) return;
    setRsvps((prev) => ({ ...prev, [gameId]: status }));

    const supabase = createClient();
    await supabase
      .from('session_rsvps')
      .upsert(
        { game_id: gameId, player_id: myPlayerId, status },
        { onConflict: 'game_id,player_id' }
      );
  }

  if (!sessions.length) {
    return (
      <p className="mt-4 text-sm text-[#9AA1B5]">Nothing scheduled yet.</p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                {s.session_type === 'practice'
                  ? 'Practice'
                  : `${s.is_home ? 'vs' : '@'} ${s.opponent_name}`}
              </p>
              {s.location && (
                <p className="text-xs text-[#9AA1B5]">{s.location}</p>
              )}
            </div>
            <p className="text-sm text-[#9AA1B5]">
              {new Date(s.game_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {myPlayerId && (
            <div className="mt-3 flex gap-2 border-t border-[#2A3550] pt-3">
              {rsvpOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(s.id, opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    rsvps[s.id] === opt.value
                      ? 'bg-[#F2A93B] text-[#412402]'
                      : 'border border-[#2A3550] text-[#C8CCD8] hover:bg-[#1B2742]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

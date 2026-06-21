'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Player = {
  id: string;
  full_name: string;
  jersey_number: string | null;
};

const statuses: Array<{ value: string; label: string }> = [
  { value: 'going', label: 'Going' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'not_going', label: "Can't go" },
];

export default function AttendancePanel({
  gameId,
  players,
  initialRsvps,
}: {
  gameId: string;
  players: Player[];
  initialRsvps: Record<string, string>;
}) {
  const [rsvps, setRsvps] = useState(initialRsvps);

  async function setStatus(playerId: string, status: string) {
    setRsvps((prev) => ({ ...prev, [playerId]: status }));

    const supabase = createClient();
    await supabase
      .from('session_rsvps')
      .upsert(
        { game_id: gameId, player_id: playerId, status },
        { onConflict: 'game_id,player_id' }
      );
  }

  const counts = players.reduce(
    (acc, p) => {
      const s = rsvps[p.id];
      if (s === 'going') acc.going++;
      else if (s === 'maybe') acc.maybe++;
      else if (s === 'not_going') acc.notGoing++;
      else acc.noResponse++;
      return acc;
    },
    { going: 0, maybe: 0, notGoing: 0, noResponse: 0 }
  );

  return (
    <div className="mt-8">
      <div className="flex gap-4 text-sm text-[#9AA1B5]">
        <span className="text-[#3C7A3E]">{counts.going} going</span>
        <span>{counts.maybe} maybe</span>
        <span className="text-[#D85A30]">{counts.notGoing} can&apos;t go</span>
        <span>{counts.noResponse} no response</span>
      </div>

      <div className="mt-4 space-y-2">
        {!players.length ? (
          <p className="text-sm text-[#9AA1B5]">
            No players on the roster yet.
          </p>
        ) : (
          players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3"
            >
              <p className="text-sm">
                {p.jersey_number ? (
                  <span className="text-[#9AA1B5]">#{p.jersey_number} </span>
                ) : null}
                {p.full_name}
              </p>
              <div className="flex gap-2">
                {statuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStatus(p.id, s.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      rsvps[p.id] === s.value
                        ? 'bg-[#F2A93B] text-[#412402]'
                        : 'border border-[#2A3550] text-[#C8CCD8] hover:bg-[#1B2742]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

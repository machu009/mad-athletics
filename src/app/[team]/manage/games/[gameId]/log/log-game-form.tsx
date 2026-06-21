'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { StatField } from '@/lib/sports';

type Player = {
  id: string;
  full_name: string;
  jersey_number: string | null;
};

type ExistingStat = {
  player_id: string;
  stats: Record<string, number>;
};

export default function LogGameForm({
  gameId,
  initialTeamScore,
  initialOpponentScore,
  players,
  statFields,
  existingStats,
}: {
  gameId: string;
  initialTeamScore: number | null;
  initialOpponentScore: number | null;
  players: Player[];
  statFields: StatField[];
  existingStats: ExistingStat[];
}) {
  const router = useRouter();
  const [teamScore, setTeamScore] = useState(
    initialTeamScore?.toString() ?? ''
  );
  const [opponentScore, setOpponentScore] = useState(
    initialOpponentScore?.toString() ?? ''
  );

  const initialValues: Record<string, Record<string, string>> = {};
  for (const p of players) {
    const existing = existingStats.find((s) => s.player_id === p.id);
    initialValues[p.id] = {};
    for (const f of statFields) {
      initialValues[p.id][f.key] = existing?.stats[f.key]?.toString() ?? '';
    }
  }
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  function updateValue(playerId: string, key: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');

    const supabase = createClient();

    const { error: gameError } = await supabase
      .from('games')
      .update({
        team_score: teamScore === '' ? null : Number(teamScore),
        opponent_score: opponentScore === '' ? null : Number(opponentScore),
      })
      .eq('id', gameId);

    if (gameError) {
      setStatus('error');
      return;
    }

    if (players.length) {
      const rows = players.map((p) => {
        const stats: Record<string, number> = {};
        for (const f of statFields) {
          const raw = values[p.id]?.[f.key];
          if (raw !== '' && raw !== undefined) {
            stats[f.key] = Number(raw);
          }
        }
        return { game_id: gameId, player_id: p.id, stats };
      });

      const { error: statsError } = await supabase
        .from('player_game_stats')
        .upsert(rows, { onConflict: 'game_id,player_id' });

      if (statsError) {
        setStatus('error');
        return;
      }
    }

    router.back();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="flex gap-4">
        <div>
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            OUR SCORE
          </label>
          <input
            type="number"
            value={teamScore}
            onChange={(e) => setTeamScore(e.target.value)}
            className="mt-1 w-24 rounded-lg border border-[#2A3550] bg-[#141E33] px-3 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
        <div>
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            THEIR SCORE
          </label>
          <input
            type="number"
            value={opponentScore}
            onChange={(e) => setOpponentScore(e.target.value)}
            className="mt-1 w-24 rounded-lg border border-[#2A3550] bg-[#141E33] px-3 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
      </div>

      {!statFields.length ? (
        <p className="text-sm text-[#9AA1B5]">
          No stat fields configured for this sport yet.
        </p>
      ) : !players.length ? (
        <p className="text-sm text-[#9AA1B5]">
          Add players to the roster before logging stats.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#2A3550]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2A3550] text-xs tracking-[0.12em] text-[#9AA1B5]">
                <th className="px-4 py-3 font-normal">Player</th>
                {statFields.map((f) => (
                  <th key={f.key} className="px-4 py-3 font-normal">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#2A3550] last:border-0"
                >
                  <td className="px-4 py-3">
                    {p.jersey_number ? (
                      <span className="text-[#9AA1B5]">
                        #{p.jersey_number}{' '}
                      </span>
                    ) : null}
                    {p.full_name}
                  </td>
                  {statFields.map((f) => (
                    <td key={f.key} className="px-2 py-2">
                      <input
                        type="number"
                        step="any"
                        value={values[p.id]?.[f.key] ?? ''}
                        onChange={(e) =>
                          updateValue(p.id, f.key, e.target.value)
                        }
                        className="w-16 rounded-lg border border-[#2A3550] bg-[#0E1726] px-2 py-1.5 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'saving'}
        className="rounded-lg bg-[#F2A93B] px-5 py-3 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
      >
        {status === 'saving' ? 'Saving…' : 'Save'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-[#D85A30]">
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}

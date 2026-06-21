'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Game = {
  id: string;
  opponent_name: string;
  game_date: string;
  location: string | null;
  is_home: boolean | null;
  team_score: number | null;
  opponent_score: number | null;
};

export default function ScheduleManager({
  teamId,
  teamSlug,
  initialGames,
}: {
  teamId: string;
  teamSlug: string;
  initialGames: Game[];
}) {
  const [games, setGames] = useState(initialGames);
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [isHome, setIsHome] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('games')
      .insert({
        team_id: teamId,
        opponent_name: opponent,
        game_date: new Date(date).toISOString(),
        location: location || null,
        is_home: isHome,
      })
      .select(
        'id, opponent_name, game_date, location, is_home, team_score, opponent_score'
      )
      .single();

    setSaving(false);

    if (!error && data) {
      setGames((prev) =>
        [data, ...prev].sort(
          (a, b) =>
            new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
        )
      );
      setOpponent('');
      setDate('');
      setLocation('');
      setIsHome(true);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="space-y-3 rounded-lg border border-[#2A3550] bg-[#141E33] p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
              OPPONENT
            </label>
            <input
              required
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Eastside Eagles"
              className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
            />
          </div>
          <div>
            <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
              DATE
            </label>
            <input
              required
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
              LOCATION
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Home field"
              className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#C8CCD8]">
            <input
              type="checkbox"
              checked={isHome}
              onChange={(e) => setIsHome(e.target.checked)}
              className="h-4 w-4 rounded border-[#2A3550] bg-[#0E1726] text-[#F2A93B] focus:ring-[#F2A93B]"
            />
            Home game
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
          >
            {saving ? 'Adding…' : 'Add game'}
          </button>
        </div>
      </form>

      {!games.length ? (
        <p className="text-sm text-[#9AA1B5]">No games scheduled yet.</p>
      ) : (
        <div className="space-y-2">
          {games.map((g) => {
            const logged = g.team_score != null && g.opponent_score != null;
            return (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3"
              >
                <div>
                  <p className="text-sm">
                    {g.is_home ? 'vs' : '@'} {g.opponent_name}
                    {logged && (
                      <span className="ml-2 text-[#9AA1B5]">
                        {g.team_score}–{g.opponent_score}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#9AA1B5]">
                    {new Date(g.game_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-4">
                  <Link
                    href={`/${teamSlug}/manage/games/${g.id}/live`}
                    className="text-sm text-[#F2A93B] hover:underline"
                  >
                    Live
                  </Link>
                  <Link
                    href={`/${teamSlug}/manage/games/${g.id}/log`}
                    className="text-sm text-[#F2A93B] hover:underline"
                  >
                    {logged ? 'Edit result' : 'Log result'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

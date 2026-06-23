'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUICK_SPORTS = [
  'Baseball',
  'Softball',
  'Basketball',
  'Soccer',
  'Football',
  'Volleyball',
  'Golf',
];

export default function QuickGameLauncher() {
  const router = useRouter();
  const [loadingSport, setLoadingSport] = useState<string | null>(null);
  const [errorSport, setErrorSport] = useState<string | null>(null);

  async function startQuickGame(sport: string) {
    setErrorSport(null);
    setLoadingSport(sport);

    try {
      const res = await fetch('/api/quick-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: sport.toLowerCase() }),
      });

      if (!res.ok) throw new Error('Failed to start game');

      const data = await res.json();
      if (!data.id) throw new Error('No game id returned');

      localStorage.setItem(`quick_game_token_${data.id}`, data.sessionToken);
      router.push(`/quick/${data.id}`);
    } catch {
      setErrorSport(sport);
      setLoadingSport(null);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      {QUICK_SPORTS.map((sport) => (
        <button
          key={sport}
          onClick={() => startQuickGame(sport)}
          disabled={loadingSport !== null}
          className="rounded-full border border-[#2A3550] px-4 py-2 text-sm text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B] disabled:opacity-50"
        >
          {loadingSport === sport ? 'Starting…' : sport}
        </button>
      ))}

      {errorSport && (
        <p className="mt-2 w-full text-center text-sm text-red-400">
          Couldn&apos;t start that game — try again.
        </p>
      )}
    </div>
  );
}

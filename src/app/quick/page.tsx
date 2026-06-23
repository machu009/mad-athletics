// app/quick/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SPORTS = [
  { value: 'baseball', label: 'Baseball' },
  { value: 'kickball', label: 'Kickball' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'football', label: 'Football' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'volleyball', label: 'Volleyball' },
];

export default function QuickGameStart() {
  const router = useRouter();
  const [sport, setSport] = useState('baseball');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [loading, setLoading] = useState(false);

  async function startGame() {
    setLoading(true);
    const res = await fetch('/api/quick-games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport, teamAName, teamBName }),
    });
    const data = await res.json();
    if (data.id) {
      localStorage.setItem(`quick_game_token_${data.id}`, data.sessionToken);
      router.push(`/quick/${data.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Start a quick game</h1>
      <p className="text-gray-500 mb-6">No team, no sign-up. Just a scoreboard.</p>

      <label className="block text-sm font-medium mb-1">Sport</label>
      <select
        value={sport}
        onChange={(e) => setSport(e.target.value)}
        className="w-full border rounded-lg p-2 mb-4"
      >
        {SPORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <label className="block text-sm font-medium mb-1">Team A name (optional)</label>
      <input
        value={teamAName}
        onChange={(e) => setTeamAName(e.target.value)}
        placeholder="Team A"
        className="w-full border rounded-lg p-2 mb-4"
      />

      <label className="block text-sm font-medium mb-1">Team B name (optional)</label>
      <input
        value={teamBName}
        onChange={(e) => setTeamBName(e.target.value)}
        placeholder="Team B"
        className="w-full border rounded-lg p-2 mb-6"
      />

      <button
        onClick={startGame}
        disabled={loading}
        className="w-full bg-black text-white rounded-lg py-3 font-semibold disabled:opacity-50"
      >
        {loading ? 'Starting...' : 'Start scoring'}
      </button>
    </div>
  );
}

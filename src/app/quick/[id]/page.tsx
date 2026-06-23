// app/quick/[id]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type QuickGame = {
  id: string;
  sport: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  game_state: Record<string, any>;
  status: string;
};

function TeamNameEditor({
  name,
  editable,
  onSave,
}: {
  name: string;
  editable: boolean;
  onSave: (name: string) => void;
}) {
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [name]);

  if (!editable) {
    return <p className="font-semibold mb-2">{name}</p>;
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== name) onSave(trimmed);
        else setValue(name);
      }}
      className="font-semibold mb-2 text-center bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-black w-full"
    />
  );
}

export default function QuickGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [game, setGame] = useState<QuickGame | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  useEffect(() => {
    setSessionToken(localStorage.getItem(`quick_game_token_${id}`));

    fetch(`/api/quick-games/${id}`)
      .then((res) => res.json())
      .then(setGame);

    const channel = supabase
      .channel(`quick_game_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quick_games', filter: `id=eq.${id}` },
        (payload) => setGame(payload.new as QuickGame)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const isOwner = !!sessionToken;

  async function updateGame(updates: Partial<QuickGame>) {
    if (!sessionToken) return;
    const res = await fetch(`/api/quick-games/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, ...updates }),
    });
    const data = await res.json();
    setGame(data);
  }

  function adjustScore(team: 'a' | 'b', delta: number) {
    if (!game) return;
    const key = team === 'a' ? 'score_a' : 'score_b';
    updateGame({ [key]: Math.max(0, game[key] + delta) });
  }

  function endGame() {
    updateGame({ status: 'completed' });
    setShowSavePrompt(true);
  }

  if (!game) return <div className="text-center py-12">Loading game…</div>;

  return (
    <div className="max-w-md mx-auto py-8 px-4 text-center">
      <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">{game.sport}</p>

      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <TeamNameEditor
            name={game.team_a_name}
            editable={isOwner}
            onSave={(name) => updateGame({ team_a_name: name })}
          />
          <p className="text-5xl font-bold">{game.score_a}</p>
          {isOwner && (
            <div className="flex justify-center gap-2 mt-3">
              <button onClick={() => adjustScore('a', -1)} className="border rounded-full w-10 h-10">−</button>
              <button onClick={() => adjustScore('a', 1)} className="border rounded-full w-10 h-10">+</button>
            </div>
          )}
        </div>
        <div className="px-4 text-gray-400 font-medium">vs</div>
        <div className="flex-1">
          <TeamNameEditor
            name={game.team_b_name}
            editable={isOwner}
            onSave={(name) => updateGame({ team_b_name: name })}
          />
          <p className="text-5xl font-bold">{game.score_b}</p>
          {isOwner && (
            <div className="flex justify-center gap-2 mt-3">
              <button onClick={() => adjustScore('b', -1)} className="border rounded-full w-10 h-10">−</button>
              <button onClick={() => adjustScore('b', 1)} className="border rounded-full w-10 h-10">+</button>
            </div>
          )}
        </div>
      </div>

      {!isOwner && (
        <p className="text-sm text-gray-400 mb-4">You're watching live — only the scorer can edit.</p>
      )}

      {isOwner && game.status === 'active' && (
        <button onClick={endGame} className="text-sm text-gray-500 underline">
          End game
        </button>
      )}

      {showSavePrompt && (
        <div className="mt-8 border rounded-lg p-4 bg-gray-50">
          <p className="font-medium mb-2">Want to keep this team going?</p>
          <a href="/teams/new" className="text-sm font-semibold underline">
            Save this as a real team →
          </a>
        </div>
      )}
    </div>
  );
}

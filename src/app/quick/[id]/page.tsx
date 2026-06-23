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
    return (
      <p
        className="border-b border-dashed border-[#2A3550] pb-2 text-xl font-medium text-[#F5F3EC]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {name}
      </p>
    );
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
      className="w-full border-b border-dashed border-[#2A3550] bg-transparent pb-2 text-center text-xl font-medium text-[#F5F3EC] focus:border-[#F2A93B] focus:outline-none"
      style={{ fontFamily: 'var(--font-display)' }}
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

  if (!game) {
    return (
      <div className="py-16 text-center text-sm text-[#9AA1B5]">
        Loading game…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12 text-center">
      <p
        className="text-xs tracking-[0.16em] text-[#9AA1B5]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {game.sport.toUpperCase()}
      </p>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex-1">
          <TeamNameEditor
            name={game.team_a_name}
            editable={isOwner}
            onSave={(name) => updateGame({ team_a_name: name })}
          />
          <p
            className="mt-4 text-5xl font-semibold text-[#F5F3EC]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {game.score_a}
          </p>
          {isOwner && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => adjustScore('a', -1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2A3550] text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
              >
                −
              </button>
              <button
                onClick={() => adjustScore('a', 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2A3550] text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
              >
                +
              </button>
            </div>
          )}
        </div>

        <p className="px-2 text-xl text-[#5B6478]">vs</p>

        <div className="flex-1">
          <TeamNameEditor
            name={game.team_b_name}
            editable={isOwner}
            onSave={(name) => updateGame({ team_b_name: name })}
          />
          <p
            className="mt-4 text-5xl font-semibold text-[#F5F3EC]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {game.score_b}
          </p>
          {isOwner && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => adjustScore('b', -1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2A3550] text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
              >
                −
              </button>
              <button
                onClick={() => adjustScore('b', 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2A3550] text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {!isOwner && (
        <p className="mt-8 text-sm text-[#9AA1B5]">
          You&apos;re watching live — only the scorer can edit.
        </p>
      )}

      {isOwner && game.status === 'active' && (
        <button
          onClick={endGame}
          className="mt-8 text-sm text-[#9AA1B5] underline transition-colors hover:text-[#F2A93B]"
        >
          End game
        </button>
      )}

      {showSavePrompt && (
        <div className="mt-8 rounded-lg border border-[#2A3550] bg-[#141E33] p-6">
          <p className="text-[#F5F3EC]">Want to keep this team going?</p>
          <a
            href="/coach/new"
            className="mt-2 inline-block text-sm font-semibold text-[#F2A93B] hover:underline"
          >
            Save this as a real team →
          </a>
        </div>
      )}
    </div>
  );
}

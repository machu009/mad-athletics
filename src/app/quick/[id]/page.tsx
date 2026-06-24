// app/quick/[id]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Player = {
  id: string;
  name: string;
  stats: Record<string, number>;
};

type GameState = {
  advancedMode?: boolean;
  players?: { a: Player[]; b: Player[] };
  inning?: number;
  half?: 'top' | 'bottom';
  soccerHalf?: number;
  outs?: number;
  period?: number;
  quarter?: number;
  set?: number;
  setsWonA?: number;
  setsWonB?: number;
  hole?: number;
  [key: string]: any;
};

type QuickGame = {
  id: string;
  sport: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  game_state: GameState;
  status: string;
};

// Matches the stat language already on the homepage ("hits and runs for
// baseball, points and rebounds for basketball, whatever your sport tracks").
const STAT_DEFS: Record<string, { key: string; label: string }[]> = {
  baseball: [
    { key: 'hits', label: 'Hits' },
    { key: 'runs', label: 'Runs' },
    { key: 'strikeouts', label: 'Strikeouts' },
  ],
  softball: [
    { key: 'hits', label: 'Hits' },
    { key: 'runs', label: 'Runs' },
    { key: 'strikeouts', label: 'Strikeouts' },
  ],
  basketball: [
    { key: 'points', label: 'Points' },
    { key: 'rebounds', label: 'Rebounds' },
    { key: 'assists', label: 'Assists' },
  ],
  soccer: [
    { key: 'goals', label: 'Goals' },
    { key: 'assists', label: 'Assists' },
  ],
  football: [
    { key: 'touchdowns', label: 'TDs' },
    { key: 'tackles', label: 'Tackles' },
  ],
  volleyball: [
    { key: 'kills', label: 'Kills' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'aces', label: 'Aces' },
  ],
  golf: [
    { key: 'strokes', label: 'Strokes' },
    { key: 'putts', label: 'Putts' },
  ],
};

function ordinal(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function periodLabel(n: number) {
  if (n <= 4) return `Q${n}`;
  return n === 5 ? 'OT' : `OT${n - 4}`;
}

function halfLabel(n: number) {
  if (n <= 1) return '1st Half';
  if (n === 2) return '2nd Half';
  return 'Full Time';
}

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

function PlayerStatRow({
  player,
  statDefs,
  editable,
  onIncrement,
}: {
  player: Player;
  statDefs: { key: string; label: string }[];
  editable: boolean;
  onIncrement: (statKey: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#2A3550] p-3">
      <p className="text-sm font-medium text-[#F5F3EC]">{player.name}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {statDefs.map((stat) => (
          <button
            key={stat.key}
            onClick={() => editable && onIncrement(stat.key)}
            disabled={!editable}
            className="rounded-full border border-[#2A3550] px-3 py-1 text-xs text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B] disabled:cursor-default disabled:hover:border-[#2A3550] disabled:hover:text-[#C8CCD8]"
          >
            {stat.label}: {player.stats?.[stat.key] ?? 0}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddPlayerForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player name"
        className="min-w-0 flex-1 rounded-lg border border-[#2A3550] bg-transparent px-3 py-2 text-sm text-[#F5F3EC] placeholder:text-[#5B6478] focus:border-[#F2A93B] focus:outline-none"
      />
      <button
        onClick={() => {
          if (name.trim()) {
            onAdd(name.trim());
            setName('');
          }
        }}
        className="rounded-lg border border-[#2A3550] px-4 py-2 text-sm text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B]"
      >
        Add
      </button>
    </div>
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

  function toggleAdvancedMode() {
    if (!game) return;
    updateGame({
      game_state: {
        ...game.game_state,
        advancedMode: !game.game_state?.advancedMode,
      },
    });
  }

  function addPlayer(team: 'a' | 'b', name: string) {
    if (!game) return;
    const players = game.game_state?.players ?? { a: [], b: [] };
    const newPlayer: Player = { id: crypto.randomUUID(), name, stats: {} };
    const updatedPlayers = {
      ...players,
      [team]: [...(players[team] ?? []), newPlayer],
    };
    updateGame({ game_state: { ...game.game_state, players: updatedPlayers } });
  }

  function incrementPlayerStat(team: 'a' | 'b', playerId: string, statKey: string) {
    if (!game) return;
    const players = game.game_state?.players ?? { a: [], b: [] };
    const updatedTeamPlayers = (players[team] ?? []).map((p) =>
      p.id === playerId
        ? { ...p, stats: { ...p.stats, [statKey]: (p.stats?.[statKey] ?? 0) + 1 } }
        : p
    );
    updateGame({
      game_state: { ...game.game_state, players: { ...players, [team]: updatedTeamPlayers } },
    });
  }

  // Baseball/softball: tapping an out clamps 0-3; hitting 3 resets to 0 and
  // flips the half (bottom -> top advances the inning number).
  function advanceOuts(delta: number) {
    if (!game) return;
    const state = game.game_state ?? {};
    let outs = (state.outs ?? 0) + delta;
    let inning = state.inning ?? 1;
    let half = state.half ?? 'top';

    if (outs >= 3) {
      outs = 0;
      if (half === 'top') {
        half = 'bottom';
      } else {
        half = 'top';
        inning = (typeof inning === 'number' ? inning : 1) + 1;
      }
    } else if (outs < 0) {
      outs = 0;
    }

    updateGame({ game_state: { ...state, outs, inning, half } });
  }

  // Generic +1 advance for fields that just count up: period, quarter, half, hole.
  function advanceField(field: keyof GameState, max?: number) {
    if (!game) return;
    const state = game.game_state ?? {};
    const current = (state[field] as number) ?? 1;
    if (max && current >= max) return;
    updateGame({ game_state: { ...state, [field]: current + 1 } });
  }

  function winSet(team: 'a' | 'b') {
    if (!game) return;
    const state = game.game_state ?? {};
    const key = team === 'a' ? 'setsWonA' : 'setsWonB';
    updateGame({
      game_state: {
        ...state,
        [key]: (state[key] ?? 0) + 1,
        set: (state.set ?? 1) + 1,
      },
    });
  }

  if (!game) {
    return (
      <div className="py-16 text-center text-sm text-[#9AA1B5]">
        Loading game…
      </div>
    );
  }

  const statDefs = STAT_DEFS[game.sport] ?? [];
  const advancedMode = !!game.game_state?.advancedMode;
  const playersA = game.game_state?.players?.a ?? [];
  const playersB = game.game_state?.players?.b ?? [];
  const state = game.game_state ?? {};

  function renderProgress() {
    switch (game!.sport) {
      case 'baseball':
      case 'softball': {
        const inning = state.inning ?? 1;
        const half = state.half === 'bottom' ? 'Bottom' : 'Top';
        const outs = state.outs ?? 0;
        return (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm text-[#C8CCD8]">
              {half} {ordinal(typeof inning === 'number' ? inning : 1)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-[0.16em] text-[#9AA1B5]">OUTS</span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full border border-[#2A3550] ${
                    i < outs ? 'bg-[#F2A93B]' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
            {isOwner && (
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => advanceOuts(-1)}
                  className="rounded-full border border-[#2A3550] px-3 py-1 text-xs text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B]"
                >
                  − Out
                </button>
                <button
                  onClick={() => advanceOuts(1)}
                  className="rounded-full border border-[#2A3550] px-3 py-1 text-xs text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B]"
                >
                  + Out
                </button>
              </div>
            )}
          </div>
        );
      }
      case 'basketball':
        return (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#C8CCD8]">{periodLabel(state.period ?? 1)}</p>
            {isOwner && (
              <button
                onClick={() => advanceField('period')}
                className="mt-2 text-xs text-[#9AA1B5] underline transition-colors hover:text-[#F2A93B]"
              >
                Next quarter →
              </button>
            )}
          </div>
        );
      case 'football':
        return (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#C8CCD8]">{periodLabel(state.quarter ?? 1)}</p>
            {isOwner && (
              <button
                onClick={() => advanceField('quarter')}
                className="mt-2 text-xs text-[#9AA1B5] underline transition-colors hover:text-[#F2A93B]"
              >
                Next quarter →
              </button>
            )}
          </div>
        );
      case 'soccer':
        return (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#C8CCD8]">{halfLabel(state.soccerHalf ?? 1)}</p>
            {isOwner && (state.soccerHalf ?? 1) < 2 && (
              <button
                onClick={() => advanceField('soccerHalf', 2)}
                className="mt-2 text-xs text-[#9AA1B5] underline transition-colors hover:text-[#F2A93B]"
              >
                Start 2nd half →
              </button>
            )}
          </div>
        );
      case 'volleyball':
        return (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#C8CCD8]">
              Set {state.set ?? 1} • Sets: {state.setsWonA ?? 0}–{state.setsWonB ?? 0}
            </p>
            {isOwner && (
              <div className="mt-2 flex justify-center gap-3">
                <button
                  onClick={() => winSet('a')}
                  className="text-xs text-[#9AA1B5] underline transition-colors hover:text-[#F2A93B]"
                >
                  {game!.team_a_name} won set →
                </button>
                <button
                  onClick={() => winSet('b')}
                  className="text-xs text-[#9AA1B5] underline transition-colors hover:text-[#F2A93B]"
                >
                  {game!.team_b_name} won set →
                </button>
              </div>
            )}
          </div>
        );
      case 'golf':
        return (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#C8CCD8]">Hole {state.hole ?? 1} of 18</p>
            {isOwner && (state.hole ?? 1) < 18 && (
              <button
                onClick={() => advanceField('hole', 18)}
                className="mt-2 text-xs text-[#9AA1B5] underline transition-colors hover:text-[#F2A93B]"
              >
                Next hole →
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12 text-center">
      <p
        className="text-xs tracking-[0.16em] text-[#9AA1B5]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {game.sport.toUpperCase()}
      </p>

      {renderProgress()}

      {isOwner && statDefs.length > 0 && (
        <button
          onClick={toggleAdvancedMode}
          className="mt-3 text-xs text-[#9AA1B5] underline transition-colors hover:text-[#F2A93B]"
        >
          {advancedMode ? 'Hide player stats' : 'Track player stats'}
        </button>
      )}

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

      {advancedMode && statDefs.length > 0 && (
        <div className="mt-10 space-y-8 text-left">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.16em] text-[#9AA1B5]" style={{ fontFamily: 'var(--font-display)' }}>
              {game.team_a_name.toUpperCase()}
            </p>
            {playersA.map((player) => (
              <PlayerStatRow
                key={player.id}
                player={player}
                statDefs={statDefs}
                editable={isOwner}
                onIncrement={(statKey) => incrementPlayerStat('a', player.id, statKey)}
              />
            ))}
            {isOwner && <AddPlayerForm onAdd={(name) => addPlayer('a', name)} />}
          </div>

          <div className="space-y-3">
            <p className="text-xs tracking-[0.16em] text-[#9AA1B5]" style={{ fontFamily: 'var(--font-display)' }}>
              {game.team_b_name.toUpperCase()}
            </p>
            {playersB.map((player) => (
              <PlayerStatRow
                key={player.id}
                player={player}
                statDefs={statDefs}
                editable={isOwner}
                onIncrement={(statKey) => incrementPlayerStat('b', player.id, statKey)}
              />
            ))}
            {isOwner && <AddPlayerForm onAdd={(name) => addPlayer('b', name)} />}
          </div>
        </div>
      )}

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

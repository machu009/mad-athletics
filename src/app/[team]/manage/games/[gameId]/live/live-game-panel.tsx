'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { QuickAction } from '@/lib/sports';

type Player = {
  id: string;
  full_name: string;
  jersey_number: string | null;
};

type FeedEvent = {
  id: string;
  playerName: string | null;
  isOurTeam: boolean;
  statKey: string;
  value: number;
};

export default function LiveGamePanel({
  gameId,
  opponentName,
  initialTeamScore,
  initialOpponentScore,
  players,
  quickActions,
  initialEvents,
}: {
  gameId: string;
  opponentName: string;
  initialTeamScore: number;
  initialOpponentScore: number;
  players: Player[];
  quickActions: QuickAction[];
  initialEvents: FeedEvent[];
}) {
  const [teamScore, setTeamScore] = useState(initialTeamScore);
  const [opponentScore, setOpponentScore] = useState(initialOpponentScore);
  const [feed, setFeed] = useState(initialEvents);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  function pushFeed(event: FeedEvent) {
    setFeed((f) => [event, ...f]);
  }

  async function logSimplePoints(isOurTeam: boolean, amount: number) {
    if (isOurTeam) {
      setTeamScore((s) => s + amount);
    } else {
      setOpponentScore((s) => s + amount);
    }
    pushFeed({
      id: crypto.randomUUID(),
      playerName: null,
      isOurTeam,
      statKey: 'score',
      value: amount,
    });

    const supabase = createClient();
    await supabase.from('game_events').insert({
      game_id: gameId,
      is_our_team: isOurTeam,
      stat_key: 'score',
      value: amount,
    });
    await supabase.rpc('increment_game_score', {
      p_game_id: gameId,
      p_our_amount: isOurTeam ? amount : 0,
      p_opponent_amount: isOurTeam ? 0 : amount,
    });
  }

  async function logPlayerAction(player: Player, action: QuickAction) {
    if (action.scoreValue) {
      setTeamScore((s) => s + action.scoreValue!);
    }
    pushFeed({
      id: crypto.randomUUID(),
      playerName: player.full_name,
      isOurTeam: true,
      statKey: action.key,
      value: action.value,
    });
    setActivePlayer(null);

    const supabase = createClient();
    await supabase.from('game_events').insert({
      game_id: gameId,
      player_id: player.id,
      is_our_team: true,
      stat_key: action.key,
      value: action.value,
    });
    await supabase.rpc('increment_player_stat', {
      p_game_id: gameId,
      p_player_id: player.id,
      p_stat_key: action.key,
      p_amount: action.value,
    });
    if (action.scoreValue) {
      await supabase.rpc('increment_game_score', {
        p_game_id: gameId,
        p_our_amount: action.scoreValue,
        p_opponent_amount: 0,
      });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-center gap-8 rounded-lg border border-[#2A3550] bg-[#141E33] py-8">
        <div className="text-center">
          <p className="text-xs tracking-[0.16em] text-[#9AA1B5]">US</p>
          <p
            className="text-4xl font-semibold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {teamScore}
          </p>
        </div>
        <p className="text-2xl text-[#5B6478]">–</p>
        <div className="text-center">
          <p className="text-xs tracking-[0.16em] text-[#9AA1B5]">
            {opponentName.toUpperCase()}
          </p>
          <p
            className="text-4xl font-semibold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {opponentScore}
          </p>
        </div>
      </div>

      {/* Always-available simple scoring — the entire casual-game experience */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="w-12 text-xs text-[#9AA1B5]">Us</span>
        {[1, 2, 3].map((n) => (
          <button
            key={`us-${n}`}
            onClick={() => logSimplePoints(true, n)}
            className="rounded-lg border border-[#2A3550] bg-[#141E33] px-3 py-2 text-sm text-[#C8CCD8] hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
          >
            +{n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="w-12 text-xs text-[#9AA1B5]">Them</span>
        {[1, 2, 3].map((n) => (
          <button
            key={`them-${n}`}
            onClick={() => logSimplePoints(false, n)}
            className="rounded-lg border border-[#2A3550] bg-[#141E33] px-3 py-2 text-sm text-[#C8CCD8] hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
          >
            +{n}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <label className="flex items-center gap-2 text-sm text-[#C8CCD8]">
          <input
            type="checkbox"
            checked={advancedMode}
            onChange={(e) => setAdvancedMode(e.target.checked)}
            className="h-4 w-4 rounded border-[#2A3550] bg-[#141E33] text-[#F2A93B] focus:ring-[#F2A93B]"
          />
          Track individual player stats
        </label>
      </div>

      {/* Granular per-player tracking — opt-in only */}
      {advancedMode && (
        <div className="mt-6">
          <p
            className="text-xs tracking-[0.16em] text-[#9AA1B5]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TAP A PLAYER
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlayer(p)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  activePlayer?.id === p.id
                    ? 'border-[#F2A93B] bg-[#1B2742] text-[#F2A93B]'
                    : 'border-[#2A3550] bg-[#141E33] text-[#C8CCD8] hover:bg-[#1B2742]'
                }`}
              >
                {p.jersey_number ? `#${p.jersey_number} ` : ''}
                {p.full_name}
              </button>
            ))}
          </div>

          {activePlayer && (
            <div className="mt-4 rounded-lg border border-[#2A3550] bg-[#141E33] p-4">
              <p className="text-sm text-[#9AA1B5]">
                {activePlayer.full_name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => logPlayerAction(activePlayer, action)}
                    className="rounded-lg bg-[#F2A93B] px-3 py-2 text-sm font-medium text-[#412402] hover:opacity-90"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <p
          className="text-xs tracking-[0.16em] text-[#9AA1B5]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          LIVE FEED
        </p>
        <div className="mt-3 space-y-1">
          {!feed.length ? (
            <p className="text-sm text-[#9AA1B5]">Nothing logged yet.</p>
          ) : (
            feed.slice(0, 20).map((e) => (
              <p key={e.id} className="text-sm text-[#C8CCD8]">
                {e.isOurTeam
                  ? `${e.playerName ?? 'Us'} +${e.value}${
                      e.statKey !== 'score' ? ` ${e.statKey}` : ''
                    }`
                  : `${opponentName} +${e.value}`}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

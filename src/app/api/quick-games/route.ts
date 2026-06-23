// app/api/quick-games/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const VALID_SPORTS = ['baseball', 'softball', 'basketball', 'soccer', 'football', 'volleyball', 'golf'];

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  const body = await request.json().catch(() => ({}));
  const sport = body.sport;
  const teamAName = body.teamAName?.trim() || 'Team A';
  const teamBName = body.teamBName?.trim() || 'Team B';

  if (!VALID_SPORTS.includes(sport)) {
    return NextResponse.json({ error: 'Invalid sport' }, { status: 400 });
  }

  const sessionToken = randomUUID();

  const { data, error } = await supabaseAdmin
    .from('quick_games')
    .insert({
      sport,
      team_a_name: teamAName,
      team_b_name: teamBName,
      session_token: sessionToken,
      game_state: defaultStateForSport(sport),
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, sessionToken });
}

function defaultStateForSport(sport: string) {
  const base = { advancedMode: false, players: { a: [], b: [] } };
  switch (sport) {
    case 'baseball':
    case 'softball':
      return { ...base, inning: 1, half: 'top', outs: 0 };
    case 'basketball':
      return { ...base, period: 1, periodLabel: 'Q1' };
    case 'soccer':
      return { ...base, half: 1, minute: 0 };
    case 'football':
      return { ...base, quarter: 1 };
    case 'volleyball':
      return { ...base, set: 1, setsWonA: 0, setsWonB: 0 };
    case 'golf':
      return { ...base, hole: 1 };
    default:
      return base;
  }
}

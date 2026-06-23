// app/api/quick-games/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('quick_games')
    .select('id, sport, team_a_name, team_b_name, score_a, score_b, game_state, status, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // session_token never leaves the server
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { sessionToken, ...updates } = body;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Missing session token' }, { status: 401 });
  }

  // Verify ownership before allowing the write
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('quick_games')
    .select('session_token')
    .eq('id', id)
    .single();

  if (fetchError || !existing || existing.session_token !== sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const allowedFields = ['score_a', 'score_b', 'game_state', 'status', 'team_a_name', 'team_b_name'];
  const sanitized = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );

  const { data, error } = await supabaseAdmin
    .from('quick_games')
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

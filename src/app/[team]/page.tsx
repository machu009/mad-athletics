import Link from 'next/link';
import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import JoinTeamPanel from './join-team-panel';

export default async function TeamHomePage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: nextGame } = await supabase
    .from('games')
    .select('opponent_name, game_date, location, is_home')
    .eq('team_id', team.id)
    .gte('game_date', now)
    .order('game_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: lastGame } = await supabase
    .from('games')
    .select('opponent_name, game_date, team_score, opponent_score')
    .eq('team_id', team.id)
    .lt('game_date', now)
    .order('game_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myRequestStatus: 'pending' | 'accepted' | 'declined' | null = null;
  if (user) {
    const { data: myRequest } = await supabase
      .from('join_requests')
      .select('status')
      .eq('team_id', team.id)
      .eq('profile_id', user.id)
      .maybeSingle();
    myRequestStatus =
      (myRequest?.status as 'pending' | 'accepted' | 'declined' | undefined) ??
      null;
  }

  const cards = [
    {
      label: 'Roster',
      href: `/${slug}/roster`,
      body: 'See every player on the team.',
    },
    {
      label: 'Schedule',
      href: `/${slug}/schedule`,
      body: 'Upcoming games and past results.',
    },
    {
      label: 'Stats',
      href: `/${slug}/stats`,
      body: 'Season totals for every player.',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <JoinTeamPanel
          teamId={team.id}
          teamSlug={slug}
          isRecruiting={team.is_recruiting}
          initialStatus={myRequestStatus}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#2A3550] bg-[#141E33] p-6">
          <p
            className="text-xs tracking-[0.16em] text-[#9AA1B5]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            NEXT GAME
          </p>
          {nextGame ? (
            <>
              <p className="mt-2 text-lg">
                {nextGame.is_home ? 'vs' : '@'} {nextGame.opponent_name}
              </p>
              <p className="mt-1 text-sm text-[#9AA1B5]">
                {new Date(nextGame.game_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
                {nextGame.location ? ` · ${nextGame.location}` : ''}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#9AA1B5]">
              No upcoming games scheduled.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-[#2A3550] bg-[#141E33] p-6">
          <p
            className="text-xs tracking-[0.16em] text-[#9AA1B5]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            LAST RESULT
          </p>
          {lastGame ? (
            <>
              <p className="mt-2 text-lg">
                {lastGame.team_score} – {lastGame.opponent_score} vs{' '}
                {lastGame.opponent_name}
              </p>
              <p className="mt-1 text-sm text-[#9AA1B5]">
                {new Date(lastGame.game_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#9AA1B5]">No games played yet.</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[#2A3550] sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group flex flex-col gap-2 bg-[#141E33] p-6 transition-colors hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B] focus-visible:ring-inset"
          >
            <span
              className="text-lg font-medium"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {c.label}
            </span>
            <span className="text-sm text-[#9AA1B5]">{c.body}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';
import { getSportTemplate } from '@/lib/sports';
import UpcomingList from './upcoming-list';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from('games')
    .select('id, opponent_name, game_date, location, is_home, session_type')
    .eq('team_id', team.id)
    .gte('game_date', now)
    .order('game_date', { ascending: true });

  const { data: past } = await supabase
    .from('games')
    .select(
      'id, opponent_name, game_date, location, is_home, team_score, opponent_score, session_type'
    )
    .eq('team_id', team.id)
    .lt('game_date', now)
    .eq('session_type', 'game')
    .order('game_date', { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myPlayerId: string | null = null;
  const myRsvps: Record<string, string> = {};

  if (user) {
    const { data: myPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', team.id)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (myPlayer) {
      myPlayerId = myPlayer.id;
      const { data: rsvps } = await supabase
        .from('session_rsvps')
        .select('game_id, status')
        .eq('player_id', myPlayer.id);
      for (const r of rsvps ?? []) {
        myRsvps[r.game_id] = r.status;
      }
    }
  }

  const { lowerScoreWins } = getSportTemplate(team.sport);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section>
        <h2
          className="text-sm tracking-[0.16em] text-[#9AA1B5]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          UPCOMING
        </h2>
        <UpcomingList
          sessions={upcoming ?? []}
          myPlayerId={myPlayerId}
          initialRsvps={myRsvps}
        />
      </section>

      <section>
        <h2
          className="text-sm tracking-[0.16em] text-[#9AA1B5]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          RESULTS
        </h2>
        <div className="mt-4 space-y-2">
          {!past?.length ? (
            <p className="text-sm text-[#9AA1B5]">No games played yet.</p>
          ) : (
            past.map((g) => {
              const played = g.team_score != null && g.opponent_score != null;
              const won = played
                ? lowerScoreWins
                  ? g.team_score! < g.opponent_score!
                  : g.team_score! > g.opponent_score!
                : null;
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3"
                >
                  <div>
                    <p className="text-sm">
                      {g.is_home ? 'vs' : '@'} {g.opponent_name}
                      {played && (
                        <span
                          className={`ml-2 ${
                            won ? 'text-[#3C7A3E]' : 'text-[#D85A30]'
                          }`}
                        >
                          {g.team_score}–{g.opponent_score}
                        </span>
                      )}
                    </p>
                    {g.location && (
                      <p className="text-xs text-[#9AA1B5]">{g.location}</p>
                    )}
                  </div>
                  <p className="text-sm text-[#9AA1B5]">
                    {formatDate(g.game_date)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const sports = [
  'Baseball',
  'Softball',
  'Basketball',
  'Soccer',
  'Football',
  'Volleyball',
  'Golf',
];

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('events')
    .select('id, title, sport, event_date, location, host_team_id, teams(name, slug)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(50);

  if (sport) {
    query = query.eq('sport', sport);
  }

  const { data: events } = await query;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Events
        </h1>
        <Link
          href="/events/new"
          className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
        >
          Create event
        </Link>
      </div>

      <form method="get" className="mt-4">
        <select
          name="sport"
          defaultValue={sport ?? ''}
          className="rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        >
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s} value={s.toLowerCase()}>
              {s}
            </option>
          ))}
        </select>
      </form>

      <div className="mt-8 space-y-2">
        {!events?.length ? (
          <p className="text-sm text-[#9AA1B5]">No upcoming events yet.</p>
        ) : (
          events.map((e) => {
            const host = e.teams as unknown as {
              name: string;
              slug: string;
            } | null;
            return (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 transition-colors hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
              >
                <div>
                  <p className="text-sm">{e.title}</p>
                  <p className="text-xs text-[#9AA1B5]">
                    {e.sport && (
                      <span className="capitalize">{e.sport} · </span>
                    )}
                    {host ? `Hosted by ${host.name}` : 'Open event'}
                    {e.location ? ` · ${e.location}` : ''}
                  </p>
                </div>
                <p className="text-sm text-[#9AA1B5]">
                  {new Date(e.event_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

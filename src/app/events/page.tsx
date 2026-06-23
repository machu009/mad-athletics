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

const eventTypes: Array<{ value: string; label: string }> = [
  { value: 'pickup', label: 'Pickup' },
  { value: 'practice', label: 'Practice' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; type?: string }>;
}) {
  const { sport, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('events')
    .select(
      'id, title, event_type, sport, event_date, location, host_team_id, teams(name, slug)'
    )
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(50);

  if (sport) {
    query = query.eq('sport', sport);
  }
  if (type) {
    query = query.eq('event_type', type);
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

      <form method="get" className="mt-4 flex gap-3">
        <select
          name="type"
          defaultValue={type ?? ''}
          className="rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        >
          <option value="">All types</option>
          {eventTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
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
            const typeLabel =
              eventTypes.find((t) => t.value === e.event_type)?.label ??
              e.event_type;
            return (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 transition-colors hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
              >
                <div>
                  <p className="text-sm">{e.title}</p>
                  <p className="text-xs text-[#9AA1B5]">
                    <span className="text-[#F2A93B]">{typeLabel}</span>
                    {e.sport && <span className="capitalize"> · {e.sport}</span>}
                    {' · '}
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

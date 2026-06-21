import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date, location, host_team_id, teams(name, slug)')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(50);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
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

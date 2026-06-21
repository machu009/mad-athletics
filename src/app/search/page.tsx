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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sport?: string; location?: string }>;
}) {
  const { q, sport, location } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from('teams')
    .select('id, name, slug, sport, location')
    .order('name', { ascending: true })
    .limit(50);

  if (sport) {
    query = query.ilike('sport', sport);
  }
  if (q) {
    query = query.ilike('name', `%${q}%`);
  }
  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  const { data: teams } = await query;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[#9AA1B5] hover:text-[#F2A93B]">
        ← Home
      </Link>

      <h1
        className="mt-4 text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Find a team
      </h1>

      <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Team name"
          className="flex-1 rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
        <select
          name="sport"
          defaultValue={sport ?? ''}
          className="rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        >
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s} value={s.toLowerCase()}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="location"
          defaultValue={location ?? ''}
          placeholder="City, state"
          className="rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#F2A93B] px-5 py-3 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
        >
          Search
        </button>
      </form>

      <div className="mt-8 space-y-2">
        {!teams?.length ? (
          <div className="rounded-lg border border-[#2A3550] bg-[#141E33] p-6 text-center">
            <p className="text-sm text-[#9AA1B5]">No teams found.</p>
            <Link
              href={`/coach/new${sport ? `?sport=${sport}` : ''}`}
              className="mt-3 inline-block text-sm text-[#F2A93B] hover:underline"
            >
              Don&apos;t see your team? Create it →
            </Link>
          </div>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              href={`/${team.slug}`}
              className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 transition-colors hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
            >
              <div>
                <p className="text-sm">{team.name}</p>
                {team.location && (
                  <p className="text-xs text-[#9AA1B5]">{team.location}</p>
                )}
              </div>
              <span
                className="text-xs tracking-[0.12em] text-[#F2A93B]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {team.sport.toUpperCase()}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

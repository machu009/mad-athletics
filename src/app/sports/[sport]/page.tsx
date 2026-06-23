import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TeamsMap from './teams-map';

const sportLabels: Record<string, string> = {
  baseball: 'Baseball',
  softball: 'Softball',
  basketball: 'Basketball',
  soccer: 'Soccer',
  football: 'Football',
  volleyball: 'Volleyball',
  golf: 'Golf',
};

export default async function SportLandingPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  const slug = sport.toLowerCase();
  const label = sportLabels[slug];

  if (!label) {
    notFound();
  }

  const supabase = await createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, slug, latitude, longitude')
    .eq('sport', slug)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  const { count: interestCount } = await supabase
    .from('sport_interests')
    .select('id', { count: 'exact', head: true })
    .eq('sport', slug);

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16 text-center">
      <p
        className="text-xs tracking-[0.16em] text-[#F2A93B]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {label.toUpperCase()}
      </p>
      <h1
        className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Run a {label.toLowerCase()} team, or find one near you.
      </h1>

      <div className="mt-10 grid w-full max-w-2xl gap-px overflow-hidden rounded-lg border border-[#2A3550] sm:grid-cols-2">
        <Link
          href={`/coach/new?sport=${slug}`}
          className="group flex flex-col gap-2 bg-[#141E33] p-7 text-left transition-colors hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B] focus-visible:ring-inset"
        >
          <span
            className="text-xs tracking-[0.16em] text-[#F2A93B]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            COACH
          </span>
          <span
            className="text-xl font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Claim your team
          </span>
          <span className="text-sm text-[#9AA1B5]">
            Set up your roster, schedule, and stats — free to start.
          </span>
        </Link>

        <Link
          href={`/search?sport=${slug}`}
          className="group flex flex-col gap-2 bg-[#141E33] p-7 text-left transition-colors hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B] focus-visible:ring-inset"
        >
          <span
            className="text-xs tracking-[0.16em] text-[#F2A93B]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            PLAYER / PARENT
          </span>
          <span
            className="text-xl font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Find a team
          </span>
          <span className="text-sm text-[#9AA1B5]">
            Look up schedule, roster, and stats by location.
          </span>
        </Link>
      </div>

      {/* Demand signal — aggregate only, no individual names, no contact mechanism */}
      <div className="mt-10 w-full max-w-2xl rounded-lg border border-[#2A3550] bg-[#141E33] p-6 text-left">
        <p className="text-sm text-[#F2A93B]">
          {interestCount && interestCount > 0
            ? `${interestCount} ${interestCount === 1 ? 'person' : 'people'} interested in playing ${label.toLowerCase()}`
            : `Be the first to flag interest in ${label.toLowerCase()}`}
        </p>
        <p className="mt-1 text-sm text-[#9AA1B5]">
          Want to actually get a game going? Start an open event — anyone
          interested can find it and sign up.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link
            href={`/events/new?sport=${slug}`}
            className="text-sm text-[#F2A93B] hover:underline"
          >
            Start a {label.toLowerCase()} event →
          </Link>
          <Link
            href={`/events?sport=${slug}`}
            className="text-sm text-[#9AA1B5] hover:text-[#F2A93B] hover:underline"
          >
            Browse existing events →
          </Link>
          <Link
            href="/profile"
            className="text-sm text-[#9AA1B5] hover:text-[#F2A93B] hover:underline"
          >
            Add yourself to the interest list →
          </Link>
        </div>
      </div>

      <div className="mt-10 w-full max-w-2xl text-left">
        <h2
          className="text-sm tracking-[0.16em] text-[#9AA1B5]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label.toUpperCase()} TEAMS NEAR YOU
        </h2>
        <div className="mt-4">
          <TeamsMap
            teams={(teams ?? []).map((t) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
              latitude: t.latitude as number,
              longitude: t.longitude as number,
            }))}
          />
        </div>
      </div>

      <Link
        href="/"
        className="mt-10 text-sm text-[#9AA1B5] hover:text-[#F2A93B]"
      >
        ← All sports
      </Link>
    </div>
  );
}

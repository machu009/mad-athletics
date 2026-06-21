import { notFound } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
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

      <Link
        href="/"
        className="mt-10 text-sm text-[#9AA1B5] hover:text-[#F2A93B]"
      >
        ← All sports
      </Link>
    </div>
  );
}

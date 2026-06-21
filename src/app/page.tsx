import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Mad Athletics — track every game live',
  description:
    'Tap to track the score as it happens — pickup games and full league seasons, all in one place.',
};

const paths = [
  {
    tag: 'COACH',
    title: 'Run your team',
    body: 'Roster, schedule, and live stats for every game — from a Tuesday pickup run to a full season.',
    cta: 'Set up your team',
    href: '/coach/new',
  },
  {
    tag: 'PLAYER / PARENT',
    title: 'Find a team or event',
    body: "Look up any team's schedule and stats, or find a pickup game or tournament near you.",
    cta: 'Find a team',
    href: '/search',
    secondaryCta: 'Browse events',
    secondaryHref: '/events',
  },
  {
    tag: 'LEAGUE',
    title: 'Run a league',
    body: 'Divisions, standings, and every team in one shared hub.',
    cta: 'Set up your league',
    href: '/league/new',
  },
];

const layers = ['League', 'Division', 'Team', 'Roster'];

const sports = [
  'Baseball',
  'Softball',
  'Basketball',
  'Soccer',
  'Football',
  'Volleyball',
  'Golf',
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen">
      {/* nav */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span
          className="text-lg font-semibold tracking-[0.18em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          MAD ATHLETICS
        </span>
        {user ? (
          <form
            action="/auth/sign-out"
            method="post"
            className="flex items-center gap-3"
          >
            <span className="text-sm text-[#9AA1B5]">{user.email}</span>
            <button
              type="submit"
              className="rounded-sm px-1 text-sm text-[#C8CCD8] hover:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
            >
              Sign out
            </button>
          </form>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-sm px-1 text-sm text-[#C8CCD8] hover:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
          >
            Sign in
          </Link>
        )}
      </header>

      {/* hero */}
      <section className="px-6 pb-16 pt-10 text-center sm:px-10 sm:pb-24 sm:pt-16">
        <h1
          className="mx-auto max-w-3xl text-4xl font-semibold uppercase leading-[1.05] tracking-tight sm:text-6xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="flap-word">Pickup game tonight.</span>{' '}
          <span className="flap-word" style={{ animationDelay: '0.12s' }}>
            Full season ahead.
          </span>{' '}
          <span
            className="flap-word text-[#F2A93B]"
            style={{ animationDelay: '0.24s' }}
          >
            Same scoreboard.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-[#C8CCD8] sm:text-lg">
          Tap to track the score as it happens. Works for two friends
          keeping score at the gym, and for a full league running every
          division all year.
        </p>
      </section>

      {/* routing panels */}
      <section className="px-6 pb-20 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded-lg border border-[#2A3550] sm:grid-cols-3">
          {paths.map((p) => (
            <div
              key={p.tag}
              className="flex flex-col gap-3 bg-[#141E33] p-7 transition-colors hover:bg-[#1B2742]"
            >
              <span
                className="text-xs tracking-[0.16em] text-[#F2A93B]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {p.tag}
              </span>
              <span
                className="text-xl font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {p.title}
              </span>
              <span className="text-sm text-[#9AA1B5]">{p.body}</span>
              <div className="mt-2 flex flex-col gap-1">
                <Link
                  href={p.href}
                  className="text-sm text-[#F2A93B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B] rounded-sm"
                >
                  {p.cta} →
                </Link>
                {p.secondaryCta && p.secondaryHref && (
                  <Link
                    href={p.secondaryHref}
                    className="text-sm text-[#9AA1B5] hover:text-[#F2A93B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B] rounded-sm"
                  >
                    {p.secondaryCta} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* how scoring works */}
      <section className="px-6 pb-24 sm:px-10">
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-2 sm:items-center">
          <div>
            <h2
              className="text-sm tracking-[0.16em] text-[#9AA1B5]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              HOW SCORING WORKS
            </h2>
            <p className="mt-4 text-lg text-[#F5F3EC]">
              Open the game. Tap the score as it happens.
            </p>
            <p className="mt-3 text-sm text-[#9AA1B5]">
              That&apos;s the whole casual version — no roster, no setup.
              Flip on individual stat tracking and the same screen captures
              every player&apos;s box score too, sport by sport: hits and
              runs for baseball, points and rebounds for basketball,
              whatever your sport tracks. Either way, it&apos;s saved the
              moment you tap it — not written down and entered later.
            </p>
          </div>

          {/* static mockup of the live scoring panel */}
          <div className="rounded-lg border border-[#2A3550] bg-[#141E33] p-6">
            <div className="flex items-center justify-center gap-8 rounded-lg border border-[#2A3550] bg-[#0E1726] py-6">
              <div className="text-center">
                <p className="text-xs tracking-[0.16em] text-[#9AA1B5]">
                  US
                </p>
                <p
                  className="text-3xl font-semibold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  14
                </p>
              </div>
              <p className="text-xl text-[#5B6478]">–</p>
              <div className="text-center">
                <p className="text-xs tracking-[0.16em] text-[#9AA1B5]">
                  THEM
                </p>
                <p
                  className="text-3xl font-semibold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  11
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className="rounded-lg border border-[#2A3550] px-3 py-2 text-sm text-[#C8CCD8]"
                >
                  +{n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* sport picker */}
      <section className="px-6 pb-20 sm:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <h2
            className="text-sm tracking-[0.16em] text-[#9AA1B5]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            OR BROWSE BY SPORT
          </h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {sports.map((sport) => (
              <Link
                key={sport}
                href={`/sports/${sport.toLowerCase()}`}
                className="rounded-full border border-[#2A3550] px-4 py-2 text-sm text-[#C8CCD8] transition-colors hover:border-[#F2A93B] hover:text-[#F2A93B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
              >
                {sport}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* structure */}
      <section className="px-6 pb-24 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-sm tracking-[0.16em] text-[#9AA1B5]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            HOW IT&apos;S STRUCTURED
          </h2>
          <div className="mt-5 flex flex-col sm:flex-row sm:items-stretch">
            {layers.map((level, i) => (
              <div
                key={level}
                className="flex flex-1 items-center gap-3 border-t border-[#2A3550] py-4 sm:border-l sm:border-t-0 sm:py-2 sm:pl-4"
              >
                <span className="text-sm text-[#3C7A3E]" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-[#F5F3EC]">{level}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-[#9AA1B5]">
            Coaches in the same league share standings and a schedule
            across every division — no separate sign-up for each team. A
            team doesn&apos;t need a league at all, though: skip it and run
            standalone, the way a pickup team would.
          </p>
        </div>
      </section>

      <style>{`
        .flap-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(0.4em);
          animation: flap-in 0.45s ease-out forwards;
        }
        @keyframes flap-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .flap-word {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}

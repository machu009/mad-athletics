import type { Metadata } from 'next';
import Link from 'next/link';
import { Oswald, Inter } from 'next/font/google';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Mad Athletics — every team, every league, one scoreboard',
  description:
    'Set up your team in minutes, or find the schedule, roster, and stats for any team in your league.',
};

const paths = [
  {
    tag: 'COACH',
    title: 'Run your team',
    body: 'Build your roster, schedule games, and post stats — free to start.',
    cta: 'Set up your team',
    href: '/coach/new',
  },
  {
    tag: 'PLAYER / PARENT',
    title: 'Find your team',
    body: "Look up any team's schedule, roster, and stats by league or location.",
    cta: 'Find a team',
    href: '/search',
  },
  {
    tag: 'LEAGUE',
    title: 'Run a league',
    body: 'Connect every division and team under one shared hub.',
    cta: 'Set up your league',
    href: '/league/new',
  },
];

const layers = ['League', 'Division', 'Team', 'Roster'];

export default function HomePage() {
  return (
    <main
      className={`${oswald.variable} ${inter.variable} min-h-screen bg-[#10192B] text-[#F5F3EC]`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* nav */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span
          className="text-lg font-semibold tracking-[0.18em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          MAD ATHLETICS
        </span>
        <Link
          href="/sign-in"
          className="rounded-sm px-1 text-sm text-[#C8CCD8] hover:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
        >
          Sign in
        </Link>
      </header>

      {/* hero */}
      <section className="px-6 pb-16 pt-10 text-center sm:px-10 sm:pb-24 sm:pt-16">
        <h1
          className="mx-auto max-w-3xl text-4xl font-semibold uppercase leading-[1.05] tracking-tight sm:text-6xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="flap-word">Every team.</span>{' '}
          <span className="flap-word" style={{ animationDelay: '0.12s' }}>
            Every league.
          </span>{' '}
          <span
            className="flap-word text-[#F2A93B]"
            style={{ animationDelay: '0.24s' }}
          >
            One scoreboard.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-[#C8CCD8] sm:text-lg">
          Set up your team in minutes, or find the schedule, roster, and
          stats for any team in your league.
        </p>
      </section>

      {/* routing panels */}
      <section className="px-6 pb-20 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded-lg border border-[#2A3550] sm:grid-cols-3">
          {paths.map((p) => (
            <Link
              key={p.tag}
              href={p.href}
              className="group relative flex flex-col gap-3 bg-[#141E33] p-7 transition-colors hover:bg-[#1B2742] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B] focus-visible:ring-inset"
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
              <span className="mt-2 text-sm text-[#F2A93B] group-hover:underline">
                {p.cta} →
              </span>
            </Link>
          ))}
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
            Every team lives inside a division, every division inside a
            league. Coaches in the same league share a schedule, standings,
            and a chat — no separate sign-up for each team.
          </p>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-[#2A3550] px-6 py-8 sm:px-10">
        <p className="text-sm text-[#9AA1B5]">
          Part of the{' '}
          <a
            href="https://mad-garage.com"
            className="rounded-sm text-[#F5F3EC] hover:text-[#F2A93B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
          >
            MAD
          </a>{' '}
          family.
        </p>
      </footer>

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

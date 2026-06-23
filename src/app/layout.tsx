import type { Metadata } from 'next';
import { Oswald, Inter } from 'next/font/google';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

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
  title: 'Mad Athletics',
  description: 'Every team. Every league. One scoreboard.',
};

const navLinkClass =
  'rounded-sm text-sm text-[#C8CCD8] hover:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body
        className="flex min-h-screen flex-col bg-[#10192B] text-[#F5F3EC]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-10">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.18em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            MAD ATHLETICS
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            <Link href="/search" className={navLinkClass}>
              Find a team
            </Link>
            <Link href="/events" className={navLinkClass}>
              Events
            </Link>
            {user ? (
              <>
                <Link href="/coach" className={navLinkClass}>
                  Your teams
                </Link>
                <Link href="/profile" className={navLinkClass}>
                  Profile
                </Link>
                <span className="text-sm text-[#9AA1B5]">{user.email}</span>
                <form action="/auth/sign-out" method="post">
                  <button type="submit" className={navLinkClass}>
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/sign-in" className={navLinkClass}>
                Sign in
              </Link>
            )}
          </nav>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-[#2A3550] px-6 py-8 text-center sm:px-10">
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
      </body>
    </html>
  );
}

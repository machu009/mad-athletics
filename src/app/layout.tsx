import type { Metadata } from 'next';
import { Oswald, Inter } from 'next/font/google';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body
        className="flex min-h-screen flex-col bg-[#10192B] text-[#F5F3EC]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
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

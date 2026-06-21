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
        className="bg-[#10192B] text-[#F5F3EC]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {children}
      </body>
    </html>
  );
}

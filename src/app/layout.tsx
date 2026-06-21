import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

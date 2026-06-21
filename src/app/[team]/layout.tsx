import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTeamBySlug } from '@/lib/teams';
import { getMembership } from '@/lib/membership';

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);

  if (!team) {
    notFound();
  }

  const membership = await getMembership(team.id);

  const tabs = [
    { label: 'Home', href: `/${slug}` },
    { label: 'Roster', href: `/${slug}/roster` },
    { label: 'Schedule', href: `/${slug}/schedule` },
    { label: 'Stats', href: `/${slug}/stats` },
    ...(membership ? [{ label: 'Manage', href: `/${slug}/manage` }] : []),
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2A3550] px-6 py-6 sm:px-10">
        <p
          className="text-xs tracking-[0.16em] text-[#F2A93B]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {team.sport.toUpperCase()}
        </p>
        <h1
          className="mt-1 text-2xl font-semibold sm:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {team.name}
        </h1>
        {team.location && (
          <p className="mt-1 text-sm text-[#9AA1B5]">{team.location}</p>
        )}
        <nav className="mt-5 flex gap-6">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-sm text-sm text-[#C8CCD8] hover:text-[#F2A93B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="px-6 py-10 sm:px-10">{children}</main>
    </div>
  );
}

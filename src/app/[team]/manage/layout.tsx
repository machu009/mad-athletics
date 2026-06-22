import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getTeamBySlug } from '@/lib/teams';
import { getMembership } from '@/lib/membership';
import { createClient } from '@/lib/supabase/server';

export default async function ManageLayout({
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/${slug}/manage`)}`);
  }

  const membership = await getMembership(team.id);

  if (!membership) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-[#9AA1B5]">
          You&apos;re not listed as a coach on this team.
        </p>
      </div>
    );
  }

  const tabs = [
    { label: 'Roster', href: `/${slug}/manage/roster` },
    { label: 'Schedule', href: `/${slug}/manage/schedule` },
    { label: 'Coaches', href: `/${slug}/manage/coaches` },
    { label: 'Settings', href: `/${slug}/manage/settings` },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="flex gap-6 border-b border-[#2A3550] pb-4">
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
      <div className="mt-6">{children}</div>
    </div>
  );
}

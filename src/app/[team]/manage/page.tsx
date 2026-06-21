import { redirect } from 'next/navigation';

export default async function ManageIndexPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;
  redirect(`/${team}/manage/roster`);
}

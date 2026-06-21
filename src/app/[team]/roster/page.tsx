import { getTeamBySlug } from '@/lib/teams';
import { createClient } from '@/lib/supabase/server';

export default async function RosterPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) return null;

  const supabase = await createClient();
  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, jersey_number, position')
    .eq('team_id', team.id)
    .order('jersey_number', { ascending: true, nullsFirst: false });

  return (
    <div className="mx-auto max-w-3xl">
      {!players?.length ? (
        <p className="text-sm text-[#9AA1B5]">
          No players on the roster yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#2A3550]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2A3550] text-xs tracking-[0.12em] text-[#9AA1B5]">
                <th className="px-4 py-3 font-normal">#</th>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Position</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#2A3550] last:border-0"
                >
                  <td className="px-4 py-3 text-[#9AA1B5]">
                    {p.jersey_number ?? '—'}
                  </td>
                  <td className="px-4 py-3">{p.full_name}</td>
                  <td className="px-4 py-3 text-[#9AA1B5]">
                    {p.position ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

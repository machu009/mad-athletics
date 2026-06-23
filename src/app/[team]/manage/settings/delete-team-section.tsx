'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeleteTeamSection({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (confirmText !== teamName) return;
    setDeleting(true);
    setError('');

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteError) {
      setDeleting(false);
      setError('Something went wrong. Try again.');
      return;
    }

    router.push('/coach');
  }

  return (
    <div className="mt-10 rounded-lg border border-[#D85A30] bg-[#1B1320] p-4">
      <p className="text-sm font-medium text-[#D85A30]">Delete this team</p>
      <p className="mt-1 text-xs text-[#9AA1B5]">
        Permanently deletes the team, its entire roster, schedule, logged
        stats, RSVPs, and join requests. There&apos;s no undo. Type the
        team&apos;s name to confirm: <strong>{teamName}</strong>
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={teamName}
        className="mt-3 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#D85A30]"
      />
      <button
        onClick={handleDelete}
        disabled={confirmText !== teamName || deleting}
        className="mt-3 rounded-lg bg-[#D85A30] px-4 py-2 text-sm font-medium text-[#1B1320] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {deleting ? 'Deleting…' : 'Delete team permanently'}
      </button>
      {error && <p className="mt-2 text-sm text-[#D85A30]">{error}</p>}
    </div>
  );
}

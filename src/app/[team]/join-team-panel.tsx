'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function JoinTeamPanel({
  teamId,
  teamSlug,
  isRecruiting,
  initialStatus,
}: {
  teamId: string;
  teamSlug: string;
  isRecruiting: boolean;
  initialStatus: 'pending' | 'accepted' | 'declined' | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isRecruiting && status !== 'accepted') {
    return null;
  }

  if (status === 'accepted') {
    return (
      <div className="rounded-lg border border-[#2A3550] bg-[#141E33] p-4 text-sm text-[#3C7A3E]">
        You&apos;re on this team&apos;s roster.
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="rounded-lg border border-[#2A3550] bg-[#141E33] p-4 text-sm text-[#9AA1B5]">
        Your request to join is pending.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/sign-in?next=/${teamSlug}`);
      return;
    }

    const { error } = await supabase.from('join_requests').insert({
      team_id: teamId,
      profile_id: user.id,
      message: message || null,
    });

    setSaving(false);
    if (!error) {
      setStatus('pending');
    }
  }

  return (
    <div className="rounded-lg border border-[#2A3550] bg-[#141E33] p-4">
      <p className="text-sm text-[#F2A93B]">This team is recruiting.</p>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-2 rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] hover:opacity-90"
        >
          Request to join
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional note to the coach"
            rows={2}
            className="w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Sending…' : 'Send request'}
          </button>
        </form>
      )}
    </div>
  );
}

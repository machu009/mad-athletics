'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Request = {
  id: string;
  message: string | null;
  profileId: string;
  name: string;
};

export default function JoinRequestsPanel({
  teamId,
  initialRequests,
}: {
  teamId: string;
  initialRequests: Request[];
}) {
  const [requests, setRequests] = useState(initialRequests);

  async function accept(req: Request) {
    const supabase = createClient();

    await supabase.from('players').insert({
      team_id: teamId,
      full_name: req.name,
      profile_id: req.profileId,
    });

    await supabase
      .from('join_requests')
      .update({ status: 'accepted' })
      .eq('id', req.id);

    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  }

  async function decline(req: Request) {
    const supabase = createClient();
    await supabase.from('join_requests').delete().eq('id', req.id);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  }

  if (!requests.length) return null;

  return (
    <div>
      <p
        className="text-xs tracking-[0.16em] text-[#9AA1B5]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        JOIN REQUESTS
      </p>
      <div className="mt-3 space-y-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className="rounded-lg border border-[#2A3550] bg-[#141E33] p-4"
          >
            <p className="text-sm">{req.name}</p>
            {req.message && (
              <p className="mt-1 text-sm text-[#9AA1B5]">{req.message}</p>
            )}
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => accept(req)}
                className="rounded-lg bg-[#F2A93B] px-3 py-1.5 text-sm font-medium text-[#412402] hover:opacity-90"
              >
                Accept
              </button>
              <button
                onClick={() => decline(req)}
                className="rounded-lg border border-[#2A3550] px-3 py-1.5 text-sm text-[#D85A30] hover:bg-[#1B2742]"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

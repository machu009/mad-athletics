'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Member = {
  profileId: string;
  role: string;
  name: string;
};

export default function CoachesPanel({
  teamId,
  currentUserId,
  isHeadCoach,
  initialMembers,
}: {
  teamId: string;
  currentUserId: string;
  isHeadCoach: boolean;
  initialMembers: Member[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);

  const headCoachCount = members.filter((m) => m.role === 'head_coach').length;

  async function removeMember(profileId: string) {
    if (!window.confirm('Remove this coach from the team?')) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('profile_id', profileId);
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.profileId !== profileId));
    }
  }

  async function leaveTeam() {
    const myRole = members.find((m) => m.profileId === currentUserId)?.role;
    if (myRole === 'head_coach' && headCoachCount <= 1) {
      window.alert(
        "You're the only head coach — make someone else a coach first (Roster tab → Make coach) so the team isn't left without one."
      );
      return;
    }
    if (!window.confirm("Leave this team? You'll lose manage access.")) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('profile_id', currentUserId);

    if (!error) {
      router.push('/coach');
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {members.map((m) => (
        <div
          key={m.profileId}
          className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3"
        >
          <div>
            <p className="text-sm">{m.name}</p>
            <p className="text-xs text-[#9AA1B5]">
              {m.role === 'head_coach' ? 'Head coach' : 'Assistant coach'}
            </p>
          </div>
          <div className="flex gap-4">
            {m.profileId === currentUserId ? (
              <button
                onClick={leaveTeam}
                className="text-sm text-[#D85A30] hover:underline"
              >
                Leave team
              </button>
            ) : (
              isHeadCoach && (
                <button
                  onClick={() => removeMember(m.profileId)}
                  className="text-sm text-[#D85A30] hover:underline"
                >
                  Remove
                </button>
              )
            )}
          </div>
        </div>
      ))}
      <p className="text-xs text-[#9AA1B5]">
        To add a coach, accept them as a player first (Roster tab), then use
        &quot;Make coach&quot; next to their name.
      </p>
    </div>
  );
}

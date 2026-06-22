'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Player = {
  id: string;
  full_name: string;
  jersey_number: string | null;
  position: string | null;
  profile_id: string | null;
};

export default function RosterManager({
  teamId,
  initialPlayers,
  initialIsRecruiting,
}: {
  teamId: string;
  initialPlayers: Player[];
  initialIsRecruiting: boolean;
}) {
  const [players, setPlayers] = useState(initialPlayers);
  const [isRecruiting, setIsRecruiting] = useState(initialIsRecruiting);
  const [name, setName] = useState('');
  const [jersey, setJersey] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editJersey, setEditJersey] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  async function toggleRecruiting() {
    const next = !isRecruiting;
    setIsRecruiting(next);
    const supabase = createClient();
    await supabase
      .from('teams')
      .update({ is_recruiting: next })
      .eq('id', teamId);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('players')
      .insert({
        team_id: teamId,
        full_name: name,
        jersey_number: jersey || null,
        position: position || null,
      })
      .select('id, full_name, jersey_number, position, profile_id')
      .single();

    setSaving(false);

    if (!error && data) {
      setPlayers((prev) =>
        [...prev, data].sort((a, b) =>
          (a.jersey_number ?? '').localeCompare(b.jersey_number ?? '')
        )
      );
      setName('');
      setJersey('');
      setPosition('');
    }
  }

  async function handleRemove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (!error) {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    }
  }

  function startEdit(p: Player) {
    setEditingId(p.id);
    setEditName(p.full_name);
    setEditJersey(p.jersey_number ?? '');
    setEditPosition(p.position ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('players')
      .update({
        full_name: editName,
        jersey_number: editJersey || null,
        position: editPosition || null,
      })
      .eq('id', id);

    setEditSaving(false);

    if (!error) {
      setPlayers((prev) =>
        prev
          .map((p) =>
            p.id === id
              ? {
                  ...p,
                  full_name: editName,
                  jersey_number: editJersey || null,
                  position: editPosition || null,
                }
              : p
          )
          .sort((a, b) =>
            (a.jersey_number ?? '').localeCompare(b.jersey_number ?? '')
          )
      );
      setEditingId(null);
    }
  }

  async function makeCoach(p: Player) {
    if (!p.profile_id) return;
    if (!window.confirm(`Make ${p.full_name} an assistant coach?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from('team_members').insert({
      team_id: teamId,
      profile_id: p.profile_id,
      role: 'assistant_coach',
    });
    if (!error) {
      window.alert(`${p.full_name} is now an assistant coach.`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] p-4">
        <div>
          <p className="text-sm">Recruiting</p>
          <p className="text-xs text-[#9AA1B5]">
            {isRecruiting
              ? 'Players can request to join from your team page.'
              : "Team page won't show a join button."}
          </p>
        </div>
        <button
          onClick={toggleRecruiting}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isRecruiting
              ? 'bg-[#F2A93B] text-[#412402] hover:opacity-90'
              : 'border border-[#2A3550] text-[#C8CCD8] hover:bg-[#1B2742]'
          }`}
        >
          {isRecruiting ? 'On' : 'Off'}
        </button>
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 rounded-lg border border-[#2A3550] bg-[#141E33] p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            NAME
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
        <div className="w-20">
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">#</label>
          <input
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            placeholder="12"
            className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
        <div className="w-32">
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            POSITION
          </label>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="SS"
            className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
        >
          {saving ? 'Adding…' : 'Add player'}
        </button>
      </form>

      {!players.length ? (
        <p className="text-sm text-[#9AA1B5]">No players yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#2A3550]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2A3550] text-xs tracking-[0.12em] text-[#9AA1B5]">
                <th className="px-4 py-3 font-normal">#</th>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Position</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) =>
                editingId === p.id ? (
                  <tr
                    key={p.id}
                    className="border-b border-[#2A3550] last:border-0"
                  >
                    <td className="px-2 py-2">
                      <input
                        value={editJersey}
                        onChange={(e) => setEditJersey(e.target.value)}
                        className="w-14 rounded-lg border border-[#2A3550] bg-[#0E1726] px-2 py-1.5 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-2 py-1.5 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                        className="w-24 rounded-lg border border-[#2A3550] bg-[#0E1726] px-2 py-1.5 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => saveEdit(p.id)}
                          disabled={editSaving}
                          className="text-[#F2A93B] hover:underline disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-[#9AA1B5] hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {p.profile_id && (
                          <button
                            onClick={() => makeCoach(p)}
                            className="text-[#9AA1B5] hover:text-[#F2A93B] hover:underline"
                          >
                            Make coach
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(p)}
                          className="text-[#F2A93B] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(p.id)}
                          className="text-[#D85A30] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

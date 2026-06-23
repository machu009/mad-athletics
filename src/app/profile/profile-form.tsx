'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const sports = [
  'Baseball',
  'Softball',
  'Basketball',
  'Soccer',
  'Football',
  'Volleyball',
  'Golf',
];

type Interest = { id: string; sport: string; zip_code: string | null };

export default function ProfileForm({
  userId,
  initialName,
  email,
  initialInterests,
}: {
  userId: string;
  initialName: string;
  email: string;
  initialInterests: Interest[];
}) {
  const [name, setName] = useState(initialName);
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  const [interests, setInterests] = useState(initialInterests);
  const [newSport, setNewSport] = useState(sports[0]);
  const [newZip, setNewZip] = useState('');
  const [addingInterest, setAddingInterest] = useState(false);
  const [interestError, setInterestError] = useState('');

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameStatus('saving');
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', userId);
    setNameStatus(error ? 'idle' : 'saved');
  }

  async function addInterest(e: React.FormEvent) {
    e.preventDefault();
    setInterestError('');

    if (
      interests.some((i) => i.sport.toLowerCase() === newSport.toLowerCase())
    ) {
      setInterestError(
        "You've already added that sport — remove it first to change the zip code."
      );
      return;
    }

    setAddingInterest(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sport_interests')
      .insert({
        profile_id: userId,
        sport: newSport.toLowerCase(),
        zip_code: newZip || null,
      })
      .select('id, sport, zip_code')
      .single();

    setAddingInterest(false);

    if (!error && data) {
      setInterests((prev) => [...prev, data]);
      setNewZip('');
    }
  }

  async function removeInterest(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('sport_interests')
      .delete()
      .eq('id', id);
    if (!error) {
      setInterests((prev) => prev.filter((i) => i.id !== id));
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <div>
        <p className="text-xs tracking-[0.12em] text-[#9AA1B5]">EMAIL</p>
        <p className="mt-1 text-sm text-[#C8CCD8]">{email}</p>
      </div>

      <form onSubmit={saveName} className="space-y-2">
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          DISPLAY NAME
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="How your name shows on rosters and coach lists"
          className="w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
        <button
          type="submit"
          disabled={nameStatus === 'saving'}
          className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] hover:opacity-90 disabled:opacity-50"
        >
          {nameStatus === 'saving'
            ? 'Saving…'
            : nameStatus === 'saved'
              ? 'Saved'
              : 'Save name'}
        </button>
      </form>

      <div>
        <p className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          SPORTS YOU WANT TO PLAY LOCALLY
        </p>
        <p className="mt-1 text-xs text-[#9AA1B5]">
          Visible to coaches looking for players in your area — same
          zip-code privacy as team locations, never an exact address.
        </p>

        <div className="mt-3 space-y-2">
          {!interests.length ? (
            <p className="text-sm text-[#9AA1B5]">No sports added yet.</p>
          ) : (
            interests.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3"
              >
                <div>
                  <p className="text-sm capitalize">{i.sport}</p>
                  {i.zip_code && (
                    <p className="text-xs text-[#9AA1B5]">{i.zip_code}</p>
                  )}
                </div>
                <button
                  onClick={() => removeInterest(i.id)}
                  className="text-sm text-[#D85A30] hover:underline"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={addInterest} className="mt-4 flex gap-2">
          <select
            value={newSport}
            onChange={(e) => setNewSport(e.target.value)}
            className="rounded-lg border border-[#2A3550] bg-[#141E33] px-3 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          >
            {sports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            value={newZip}
            onChange={(e) => setNewZip(e.target.value.replace(/\D/g, ''))}
            maxLength={5}
            placeholder="Zip (optional)"
            className="w-28 rounded-lg border border-[#2A3550] bg-[#141E33] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
          <button
            type="submit"
            disabled={addingInterest}
            className="rounded-lg bg-[#F2A93B] px-4 py-2 text-sm font-medium text-[#412402] hover:opacity-90 disabled:opacity-50"
          >
            {addingInterest ? 'Adding…' : 'Add'}
          </button>
        </form>
        {interestError && (
          <p className="mt-2 text-sm text-[#D85A30]">{interestError}</p>
        )}
      </div>
    </div>
  );
}

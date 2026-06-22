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

export default function TeamSettingsForm({
  teamId,
  initialName,
  initialLocation,
  initialZipCode,
  initialSport,
}: {
  teamId: string;
  initialName: string;
  initialLocation: string;
  initialZipCode: string;
  initialSport: string;
}) {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [zipCode, setZipCode] = useState(initialZipCode);
  const [sport, setSport] = useState(
    sports.find((s) => s.toLowerCase() === initialSport.toLowerCase()) ??
      sports[0]
  );
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [note, setNote] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (sport.toLowerCase() !== initialSport.toLowerCase()) {
      const confirmed = window.confirm(
        "Changing the sport changes which stats show up and how they're tracked. Already-logged stats stay in the database but may not display correctly under the new sport. Continue?"
      );
      if (!confirmed) return;
    }

    setStatus('saving');
    setNote('');

    let latitude: number | null = null;
    let longitude: number | null = null;
    let geocodeFailed = false;

    if (zipCode) {
      try {
        const geoRes = await fetch('/api/geocode-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode }),
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          latitude = geoData.latitude;
          longitude = geoData.longitude;
        } else {
          geocodeFailed = true;
        }
      } catch {
        geocodeFailed = true;
      }
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('teams')
      .update({
        name,
        location: location || null,
        zip_code: zipCode || null,
        latitude,
        longitude,
        sport: sport.toLowerCase(),
      })
      .eq('id', teamId);

    if (error) {
      setStatus('error');
      setNote('Something went wrong saving. Try again.');
      return;
    }

    setStatus('saved');
    if (geocodeFailed && zipCode) {
      setNote(
        "Saved, but couldn't verify that zip code — the team may not show up on the map until it's corrected."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          TEAM NAME
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        />
      </div>

      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          SPORT
        </label>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
        >
          {sports.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            LOCATION
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Conyers, GA"
            className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
        <div className="w-28">
          <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
            ZIP CODE
          </label>
          <input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
            maxLength={5}
            placeholder="30094"
            className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        </div>
      </div>
      <p className="text-xs text-[#9AA1B5]">
        Changing the zip code updates where this team shows up on the sport
        map — still just the general area, never an exact address.
      </p>

      <button
        type="submit"
        disabled={status === 'saving'}
        className="rounded-lg bg-[#F2A93B] px-5 py-2.5 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
      >
        {status === 'saving' ? 'Saving…' : 'Save changes'}
      </button>

      {status === 'saved' && !note && (
        <p className="text-sm text-[#3C7A3E]">Saved.</p>
      )}
      {note && (
        <p
          className={`text-sm ${
            status === 'error' ? 'text-[#D85A30]' : 'text-[#9AA1B5]'
          }`}
        >
          {note}
        </p>
      )}
    </form>
  );
}

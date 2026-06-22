'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

type League = { id: string; name: string; slug: string };
type Division = { id: string; name: string };

function slugify(...parts: string[]) {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewTeamForm({
  defaultSport,
  leagues,
}: {
  defaultSport?: string;
  leagues: League[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [sport, setSport] = useState(
    sports.find((s) => s.toLowerCase() === defaultSport?.toLowerCase()) ??
      sports[0]
  );
  const [isRecruiting, setIsRecruiting] = useState(false);

  const [imPlaying, setImPlaying] = useState(false);
  const [playerName, setPlayerName] = useState('');

  const [leagueMode, setLeagueMode] = useState<'none' | 'existing' | 'new'>(
    'none'
  );
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [divisionMode, setDivisionMode] = useState<'existing' | 'new'>(
    'existing'
  );
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [newDivisionName, setNewDivisionName] = useState('');

  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueType, setNewLeagueType] = useState<'school' | 'club'>(
    'club'
  );
  const [newLeagueLocation, setNewLeagueLocation] = useState('');

  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (leagueMode !== 'existing' || !selectedLeagueId) {
      setDivisions([]);
      setSelectedDivisionId('');
      return;
    }
    const supabase = createClient();
    supabase
      .from('divisions')
      .select('id, name')
      .eq('league_id', selectedLeagueId)
      .then(({ data }) => setDivisions(data ?? []));
  }, [leagueMode, selectedLeagueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    const supabase = createClient();
    let divisionId: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;

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
        }
      } catch {
        // Non-blocking — the team just won't show up on the sport map.
      }
    }

    try {
      if (leagueMode === 'new') {
        const leagueSlug = slugify(newLeagueName, newLeagueLocation);
        const { data: newLeagueId, error: leagueError } = await supabase.rpc(
          'create_league',
          {
            p_name: newLeagueName,
            p_slug: leagueSlug,
            p_league_type: newLeagueType,
            p_location: newLeagueLocation || null,
          }
        );
        if (leagueError || !newLeagueId) {
          throw new Error('Could not create the league. Try again.');
        }

        const { data: newDivision, error: divisionError } = await supabase
          .from('divisions')
          .insert({ league_id: newLeagueId, name: newDivisionName })
          .select('id')
          .single();
        if (divisionError || !newDivision) {
          throw new Error('Could not create the division. Try again.');
        }
        divisionId = newDivision.id;
      } else if (leagueMode === 'existing' && selectedLeagueId) {
        if (divisionMode === 'new') {
          const { data: newDivision, error: divisionError } = await supabase
            .from('divisions')
            .insert({ league_id: selectedLeagueId, name: newDivisionName })
            .select('id')
            .single();
          if (divisionError || !newDivision) {
            throw new Error(
              "Only that league's admin can add a new division — pick an existing one or contact them."
            );
          }
          divisionId = newDivision.id;
        } else {
          divisionId = selectedDivisionId || null;
        }
      }

      const slug = slugify(name, location);
      const { data: newTeamId, error: teamError } = await supabase.rpc(
        'create_team',
        {
          p_name: name,
          p_slug: slug,
          p_location: location || null,
          p_sport: sport.toLowerCase(),
          p_division_id: divisionId,
          p_is_recruiting: isRecruiting,
          p_zip_code: zipCode || null,
          p_latitude: latitude,
          p_longitude: longitude,
        }
      );

      if (teamError || !newTeamId) {
        throw new Error(
          teamError?.message.includes('duplicate')
            ? 'That team URL is already taken — try adding more location detail.'
            : 'Something went wrong creating the team. Try again.'
        );
      }

      // By now the creator is already a team_member (create_team() set
      // that up), so this insert is already authorized by the existing
      // players RLS policy — no separate RPC needed for this part.
      if (imPlaying && playerName) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.from('players').insert({
          team_id: newTeamId,
          full_name: playerName,
          profile_id: user?.id,
        });
      }

      router.push(`/${slug}`);
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
          TEAM NAME
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Granger Lancers"
          className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
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
        The zip code places your team on the area map for this sport — never
        an exact address, just the general area.
      </p>

      <label className="flex items-center gap-2 text-sm text-[#C8CCD8]">
        <input
          type="checkbox"
          checked={isRecruiting}
          onChange={(e) => setIsRecruiting(e.target.checked)}
          className="h-4 w-4 rounded border-[#2A3550] bg-[#141E33] text-[#F2A93B] focus:ring-[#F2A93B]"
        />
        Open to new players — show a &quot;Request to join&quot; button on
        the team page
      </label>

      <div className="space-y-2 rounded-lg border border-[#2A3550] bg-[#141E33] p-4">
        <label className="flex items-center gap-2 text-sm text-[#C8CCD8]">
          <input
            type="checkbox"
            checked={imPlaying}
            onChange={(e) => setImPlaying(e.target.checked)}
            className="h-4 w-4 rounded border-[#2A3550] bg-[#0E1726] text-[#F2A93B] focus:ring-[#F2A93B]"
          />
          I&apos;ll also be playing on this team
        </label>
        {imPlaying && (
          <input
            required
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name, as it'll show on the roster"
            className="mt-2 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
          />
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-[#2A3550] bg-[#141E33] p-4">
        <p className="text-xs tracking-[0.12em] text-[#9AA1B5]">LEAGUE</p>
        <div className="flex flex-col gap-2">
          {[
            { value: 'none', label: 'No league — standalone team' },
            { value: 'existing', label: 'Join an existing league' },
            { value: 'new', label: 'Start a new league' },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm text-[#C8CCD8]"
            >
              <input
                type="radio"
                name="leagueMode"
                value={opt.value}
                checked={leagueMode === opt.value}
                onChange={() =>
                  setLeagueMode(opt.value as 'none' | 'existing' | 'new')
                }
                className="h-4 w-4 border-[#2A3550] bg-[#0E1726] text-[#F2A93B] focus:ring-[#F2A93B]"
              />
              {opt.label}
            </label>
          ))}
        </div>

        {leagueMode === 'existing' && (
          <div className="mt-3 space-y-3 border-t border-[#2A3550] pt-3">
            <div>
              <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
                LEAGUE
              </label>
              <select
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
              >
                <option value="">Choose a league…</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedLeagueId && (
              <div>
                <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
                  DIVISION
                </label>
                <select
                  value={
                    divisionMode === 'existing' ? selectedDivisionId : '__new__'
                  }
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setDivisionMode('new');
                    } else {
                      setDivisionMode('existing');
                      setSelectedDivisionId(e.target.value);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
                >
                  <option value="">Choose a division…</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                  <option value="__new__">+ New division</option>
                </select>
                {divisionMode === 'new' && (
                  <>
                    <input
                      value={newDivisionName}
                      onChange={(e) => setNewDivisionName(e.target.value)}
                      placeholder="e.g. 10u"
                      className="mt-2 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
                    />
                    <p className="mt-1 text-xs text-[#9AA1B5]">
                      Only works if you&apos;re that league&apos;s admin —
                      otherwise pick an existing division.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {leagueMode === 'new' && (
          <div className="mt-3 space-y-3 border-t border-[#2A3550] pt-3">
            <div>
              <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
                LEAGUE NAME
              </label>
              <input
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                placeholder="Rockdale Youth Baseball"
                className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
              />
            </div>
            <div>
              <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
                TYPE
              </label>
              <select
                value={newLeagueType}
                onChange={(e) =>
                  setNewLeagueType(e.target.value as 'school' | 'club')
                }
                className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
              >
                <option value="club">Club / travel league</option>
                <option value="school">School league</option>
              </select>
            </div>
            <div>
              <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
                LEAGUE LOCATION
              </label>
              <input
                value={newLeagueLocation}
                onChange={(e) => setNewLeagueLocation(e.target.value)}
                placeholder="Rockdale County, GA"
                className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
              />
            </div>
            <div>
              <label className="text-xs tracking-[0.12em] text-[#9AA1B5]">
                FIRST DIVISION
              </label>
              <input
                required={leagueMode === 'new'}
                value={newDivisionName}
                onChange={(e) => setNewDivisionName(e.target.value)}
                placeholder="e.g. 10u"
                className="mt-1 w-full rounded-lg border border-[#2A3550] bg-[#0E1726] px-3 py-2 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full rounded-lg bg-[#F2A93B] px-4 py-3 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
      >
        {status === 'saving' ? 'Creating…' : 'Create team'}
      </button>

      {status === 'error' && (
        <p className="text-sm text-[#D85A30]">{errorMsg}</p>
      )}
    </form>
  );
}

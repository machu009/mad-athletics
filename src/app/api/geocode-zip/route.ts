import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { zipCode } = await request.json();

  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    return NextResponse.json(
      { error: 'Enter a valid 5-digit zip code.' },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=us&format=json&limit=1`,
    {
      headers: {
        // Nominatim's usage policy requires a descriptive User-Agent —
        // browsers won't let client-side code set this, which is why
        // this has to be a server route rather than a direct client call.
        'User-Agent': 'MadAthletics/1.0 (https://mad-athletics.com)',
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Could not look up that zip code.' },
      { status: 500 }
    );
  }

  const results = await res.json();

  if (!results.length) {
    return NextResponse.json({ error: 'Zip code not found.' }, { status: 404 });
  }

  return NextResponse.json({
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
  });
}

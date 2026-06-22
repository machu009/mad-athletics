'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Team = {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
};

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function TeamsMap({ teams }: { teams: Team[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !teams.length) return;

    const map = L.map(containerRef.current).setView(
      [teams[0].latitude, teams[0].longitude],
      9
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const markers = teams.map((team) => {
      const marker = L.marker([team.latitude, team.longitude], {
        icon: markerIcon,
      }).addTo(map);
      marker.bindPopup(
        `<a href="/${team.slug}" style="color:#10192B;font-weight:600;">${team.name}</a>`
      );
      return marker;
    });

    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [teams]);

  if (!teams.length) {
    return (
      <p className="text-sm text-[#9AA1B5]">
        No teams with a location yet — be the first to add one.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-lg border border-[#2A3550]"
    />
  );
}

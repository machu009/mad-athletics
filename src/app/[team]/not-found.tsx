import Link from 'next/link';

export default function TeamNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p
        className="text-xs tracking-[0.16em] text-[#9AA1B5]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        TEAM NOT FOUND
      </p>
      <h1
        className="mt-2 text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        We couldn&apos;t find that team.
      </h1>
      <Link
        href="/search"
        className="mt-6 text-sm text-[#F2A93B] hover:underline"
      >
        Browse all teams →
      </Link>
    </div>
  );
}

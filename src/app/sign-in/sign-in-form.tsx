'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          next
        )}`,
      },
    });

    setStatus(error ? 'error' : 'sent');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[#9AA1B5]">
          We&apos;ll email you a link — no password needed.
        </p>

        {status === 'sent' ? (
          <p className="mt-6 rounded-lg border border-[#2A3550] bg-[#141E33] p-4 text-sm">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#2A3550] bg-[#141E33] px-4 py-3 text-sm text-[#F5F3EC] placeholder-[#5B6478] focus:outline-none focus:ring-2 focus:ring-[#F2A93B]"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-lg bg-[#F2A93B] px-4 py-3 text-sm font-medium text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
            >
              {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
            </button>
            {status === 'error' && (
              <p className="text-sm text-[#D85A30]">
                Something went wrong. Try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

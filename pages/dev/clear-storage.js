import { useEffect } from 'react';
import getSupabase from '../../lib/supabaseClient';

export default function ClearStoragePage() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Clear localStorage & sessionStorage
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {}

    // Sign out of Supabase
    try {
      const client = getSupabase();
      if (client) {
        client.auth.signOut().catch(() => {});
      }
    } catch {}

    // Redirect home after a tick
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-semibold">Clearing local data…</h1>
      <p className="opacity-70 mt-2">You will be redirected shortly.</p>
    </div>
  );
}



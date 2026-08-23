import { useEffect, useState } from 'react';

/**
 * Returns `true` only after the component has mounted on the client.
 * Use this to guard rendering that depends on persisted Zustand state
 * (or any other client-only value) so the server-rendered HTML matches
 * the initial client render and avoids hydration mismatch errors.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

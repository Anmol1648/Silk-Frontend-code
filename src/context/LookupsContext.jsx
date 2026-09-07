import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { config as configApi } from '../api/endpoints';
import { useAuth } from './AppContext';

/**
 * Lookups context — Req 1.
 *
 * Fetches GET /config/lookups once when the user is authenticated, then
 * caches the result for the entire session. Every dropdown on the profile
 * page reads from this context instead of hardcoded arrays.
 *
 * The endpoint is authenticated (needs a Bearer token), so we only call
 * it when isAuthed === true.
 */

const EMPTY = {
  countries: [],
  sectors: [],
  sub_sectors: [],
  funding_statuses: [],
  revenue_sizes: [],
  currencies: [],
  unit_scales: [],
};

const LookupsCtx = createContext({ ...EMPTY, loading: true });

export function LookupsProvider({ children }) {
  const { isAuthed } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthed) {
      setData(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await configApi.lookups();
        if (cancelled) return;
        if (res?.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        // Degrade silently — the profile page will fall back to empty arrays
        // and the founder can still type free-text values.
        console.warn('[LookupsContext] Failed to fetch lookups:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthed]);

  const value = useMemo(() => ({ ...data, loading }), [data, loading]);

  return <LookupsCtx.Provider value={value}>{children}</LookupsCtx.Provider>;
}

export const useLookups = () => useContext(LookupsCtx);

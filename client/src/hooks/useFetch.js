import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

// Small data-fetching hook with loading + error states
export function useFetch(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError(null);
    try {
      const { data: res } = await api.get(url);
      setData(res.data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [url]);

  useEffect(() => { refetch(); }, [refetch, ...deps]);
  return { data, loading, error, refetch };
}

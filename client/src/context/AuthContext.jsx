import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { AUTH_TOKEN_KEY } from '../services/api.js';
import { removeStored, setStored } from '../utils/storage.js';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch { setUser(null); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // Keep the server's existing HTTP-only cookie as the primary session.
    // Store only its existing short-lived Bearer equivalent in sessionStorage
    // as a compatibility fallback for browsers that drop cross-origin cookies.
    if (data.data.token) setStored(AUTH_TOKEN_KEY, data.data.token, 'session');
    setUser(data.data.user);
    toast.success(data.message);
    return data.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    removeStored(AUTH_TOKEN_KEY, 'session');
    setUser(null);
    toast.success('Signed out');
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, reload: load }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

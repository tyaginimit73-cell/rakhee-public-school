import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api.js';
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
    setUser(data.data.user);
    toast.success(data.message);
    return data.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setUser(null);
    toast.success('Signed out');
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, reload: load }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

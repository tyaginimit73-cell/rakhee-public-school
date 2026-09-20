import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api.js';

// Fallbacks mirror server defaults so the site renders even before the API responds
const fallback = {
  site: { schoolName: 'Rakhee Public School', tagline: 'Inspiring Young Minds. Building Bright Futures.', address: 'SohanJani Tagan, Muzaffarnagar, Uttar Pradesh, India', phone: '+91 00000 00000', email: 'info@rakheepublicschool.in', hours: 'Mon–Sat · 8:00 AM – 2:30 PM', establishedYear: '—', affiliation: 'Update in Settings', board: 'Update in Settings' },
  announcement: '',
  admissionOpen: true,
  hero: { headline: 'Inspiring Young Minds. Building Bright Futures.', subtext: '', image: '/images/hero-campus.jpg' },
  stats: [],
  about: { intro: '', vision: '', mission: '', values: [] },
  principal: { name: '', designation: 'Principal', photo: '/images/principal.jpg', message: '' },
  social: { facebook: '#', instagram: '#', youtube: '#' },
  feesNote: '',
  facilities: [],
};

const SettingsContext = createContext({ settings: fallback, refresh: () => {}, loading: true });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(fallback);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings((prev) => ({ ...prev, ...data.data }));
    } catch { /* keep fallbacks */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <SettingsContext.Provider value={{ settings, refresh, loading }}>{children}</SettingsContext.Provider>;
}
export const useSettings = () => useContext(SettingsContext);

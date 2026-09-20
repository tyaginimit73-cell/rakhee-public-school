import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCheck, GraduationCap, School, CalendarCheck, FileText,
  Wallet, Megaphone, CalendarDays, Image as ImageIcon, Inbox, MessageSquare, FolderOpen,
  Settings, UserCog, LogOut, Menu, X, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import api from '../services/api.js';
import { cx, initials } from '../utils/format.js';

const NAV = [
  { section: 'Overview' },
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { section: 'People' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/teachers', icon: UserCheck, label: 'Teachers' },
  { to: '/admin/users', icon: UserCog, label: 'Admin Users' },
  { section: 'Admissions & Academics' },
  { to: '/admin/admissions', icon: GraduationCap, label: 'Admissions' },
  { to: '/admin/classes', icon: School, label: 'Classes' },
  { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/admin/results', icon: FileText, label: 'Results' },
  { to: '/admin/fees', icon: Wallet, label: 'Fees' },
  { section: 'Content' },
  { to: '/admin/notices', icon: Megaphone, label: 'Notices' },
  { to: '/admin/events', icon: CalendarDays, label: 'Events' },
  { to: '/admin/gallery', icon: ImageIcon, label: 'Gallery' },
  { to: '/admin/documents', icon: FolderOpen, label: 'Documents' },
  { section: 'Communication' },
  { to: '/admin/enquiries', icon: Inbox, label: 'Enquiries' },
  { to: '/admin/messages', icon: MessageSquare, label: 'Contact Messages' },
  { section: 'System' },
  { to: '/admin/settings', icon: Settings, label: 'Website Settings' },
];

function GlobalSearch() {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 350);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!debounced || debounced.length < 2) { setResults(null); return; }
    api.get(`/search?q=${encodeURIComponent(debounced)}`).then(({ data }) => setResults(data.data)).catch(() => {});
  }, [debounced]);

  const go = (path) => { setResults(null); setQ(''); navigate(path); };
  const groups = results && [
    { key: 'students', label: 'Students', items: results.students, render: (s) => `${s.firstName} ${s.lastName} · ${s.rollNumber}`, go: () => go('/admin/students') },
    { key: 'teachers', label: 'Teachers', items: results.teachers, render: (t) => `${t.name} · ${t.department}`, go: () => go('/admin/teachers') },
    { key: 'admissions', label: 'Admissions', items: results.admissions, render: (a) => `${a.studentName} · ${a.applicationId}`, go: () => go('/admin/admissions') },
    { key: 'notices', label: 'Notices', items: results.notices, render: (n) => n.title, go: () => go('/admin/notices') },
    { key: 'events', label: 'Events', items: results.events, render: (e) => e.title, go: () => go('/admin/events') },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="relative hidden w-full max-w-sm md:block">
      <SearchInput value={q} onChange={setQ} placeholder="Search students, notices, events…" />
      <AnimatePresence>
        {results && (
          <motion.div className="card absolute left-0 right-0 top-12 z-50 max-h-96 overflow-y-auto p-2"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {groups.length === 0 && <p className="px-3 py-4 text-sm text-muted">No results for “{debounced}”.</p>}
            {groups.map((g) => (
              <div key={g.key} className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted">{g.label}</p>
                {g.items.map((item) => (
                  <button key={item._id} type="button" onClick={g.go}
                    className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-line/40">
                    {g.render(item)}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Same gap as the public Navbar's mobile drawer had: no way to close
  // this with the keyboard. Fixed the same way, here specifically (no
  // existing effect tied to `open` in this component to extend).
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const doLogout = async () => { await logout(); navigate('/login'); };

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 text-white">
      <div className="border-b border-white/10 p-5"><Logo light /></div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
        {NAV.map((item, i) => item.section ? (
          <p key={i} className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-white/40">{item.section}</p>
        ) : (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
            className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-accent-400 text-navy-950 shadow' : 'text-white/70 hover:bg-white/10 hover:text-white')}>
            <item.icon size={17} /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"><ExternalLink size={16} /> View Website</Link>
        <button type="button" onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-red-500/20 hover:text-red-300"><LogOut size={16} /> Sign Out</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-base">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} aria-hidden />
            <motion.aside className="absolute inset-y-0 left-0 w-72" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
          <button type="button" className="btn-icon lg:hidden" onClick={() => setOpen(true)} aria-label="Open sidebar"><Menu size={20} /></button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">{initials(user?.name)}</span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-bold text-ink">{user?.name}</p>
                <p className="text-[11px] font-semibold capitalize text-muted">{user?.role}</p>
              </div>
            </div>
            <button type="button" className="btn-icon" onClick={doLogout} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, ExternalLink } from 'lucide-react';
import Logo from '../components/common/Logo.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { cx, initials } from '../utils/format.js';

// Generalized version of AdminLayout's sidebar shell — same design system,
// same mobile-drawer behavior (including the Escape-key handling that had
// to be added to AdminLayout separately in an earlier pass), parameterized
// by nav items instead of hardcoding admin's. Used by the teacher, student,
// and parent portals so all three get the same quality bar from one
// implementation rather than three hand-copied ones.
export default function PortalLayout({ nav, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
      <p className="px-5 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-white/40">{title}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label={title}>
        {nav.map((item) => (
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

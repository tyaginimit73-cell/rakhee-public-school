import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Megaphone, GraduationCap, LogIn, LayoutDashboard } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { cx } from '../../utils/format.js';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/academics', label: 'Academics' },
  { to: '/admissions', label: 'Admissions' },
  { to: '/campus', label: 'Campus' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/events', label: 'Events' },
  { to: '/notices', label: 'Notices' },
  { to: '/results', label: 'Results' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [barOpen, setBarOpen] = useState(true);
  const drawerRef = useRef(null);

  // Escape handling, focus trapping and focus restoration all come from
  // useFocusTrap below — this effect keeps ONLY the pre-existing body
  // scroll lock (no second Escape listener).
  useFocusTrap(drawerRef, open, () => setOpen(false));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const portalPath = user?.role === 'admin' ? '/admin' : '/portal';

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <AnimatePresence>
        {barOpen && settings.announcement && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-navy-950 text-white">
            <div className="container-x flex items-center gap-2 py-1.5 text-xs font-medium sm:text-[13px]">
              <Megaphone size={14} className="shrink-0 text-accent-400" />
              <p className="flex-1 truncate">{settings.announcement.replace(/^[^ ]+ /, '')}</p>
              {settings.admissionOpen && <Link to="/admissions/apply" className="hidden shrink-0 rounded-full bg-accent-400 px-3 py-0.5 font-bold text-navy-950 hover:bg-accent-300 sm:inline-flex">Apply Now</Link>}
              <button type="button" onClick={() => setBarOpen(false)} aria-label="Dismiss announcement" className="shrink-0 text-white/60 hover:text-white"><X size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main nav */}
      <div className={cx('border-b transition-all duration-300', scrolled ? 'border-line bg-surface/85 shadow-soft backdrop-blur-xl' : 'border-transparent bg-surface/60 backdrop-blur-md')}>
        <div className="container-x flex h-[68px] items-center justify-between gap-4">
          <Link to="/" aria-label="Rakhee Public School — Home"><Logo /></Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}
                className={({ isActive }) => cx(
                  'relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  'after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-gradient-to-r after:from-accent-300 after:to-accent-500 after:transition-transform after:duration-300',
                  isActive ? 'text-brand-600 dark:text-brand-300 after:scale-x-100' : 'text-muted hover:text-ink after:scale-x-0 hover:after:scale-x-100',
                )}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <ThemeToggle />
            {user ? (
              <button type="button" className="btn-outline btn-sm" onClick={() => navigate(portalPath)}><LayoutDashboard size={15} /> Dashboard</button>
            ) : (
              <Link to="/login" className="btn-ghost btn-sm"><LogIn size={15} /> Parent Login</Link>
            )}
            <Link to="/admissions/apply" className="btn-accent"><GraduationCap size={17} /> Apply for Admission</Link>
          </div>

          <div className="flex items-center gap-1 xl:hidden">
            <ThemeToggle />
            <button type="button" className="btn-icon" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu"><Menu size={22} /></button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[80] xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
            <motion.div ref={drawerRef} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Main menu" tabIndex={-1}
              className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-surface shadow-lift outline-none"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="flex items-center justify-between border-b border-line p-4">
                <Logo />
                <button type="button" className="btn-icon" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile">
                {LINKS.map((l, i) => (
                  <motion.div key={l.to} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <NavLink to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}
                      className={({ isActive }) => cx('mb-1 block rounded-xl px-4 py-3 text-[15px] font-semibold', isActive ? 'bg-brand-600 text-white' : 'text-ink hover:bg-line/50')}>
                      {l.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
              <div className="space-y-2 border-t border-line p-4">
                {user ? (
                  <Link to={portalPath} onClick={() => setOpen(false)} className="btn-outline w-full"><LayoutDashboard size={16} /> Go to Dashboard</Link>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-outline w-full"><LogIn size={16} /> Parent Login</Link>
                )}
                <Link to="/admissions/apply" onClick={() => setOpen(false)} className="btn-accent w-full"><GraduationCap size={16} /> Apply for Admission</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

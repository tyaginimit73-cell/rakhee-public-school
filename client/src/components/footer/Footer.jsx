import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

const COLS = [
  { title: 'School', links: [ { to: '/about', label: 'About Us' }, { to: '/academics', label: 'Academics' }, { to: '/admissions', label: 'Admissions' }, { to: '/campus', label: 'Campus' }, { to: '/teachers', label: 'Faculty' } ] },
  { title: 'Quick Links', links: [ { to: '/events', label: 'Events' }, { to: '/gallery', label: 'Gallery' }, { to: '/notices', label: 'Notice Board' }, { to: '/results', label: 'Results' }, { to: '/admissions/track', label: 'Track Application' } ] },
];

export default function Footer() {
  const { settings } = useSettings();
  const socials = [
    { icon: Facebook, href: settings.social.facebook, label: 'Facebook' },
    { icon: Instagram, href: settings.social.instagram, label: 'Instagram' },
    { icon: Youtube, href: settings.social.youtube, label: 'YouTube' },
  ];
  return (
    <footer className="relative bg-navy-950 text-white/75">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent-400/70 to-transparent" aria-hidden />
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{settings.site.tagline} A caring, disciplined and modern learning community in Muzaffarnagar, Uttar Pradesh.</p>
          <div className="mt-5 flex gap-2">
            {socials.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href || '#'} target="_blank" rel="noreferrer" aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white/80 transition hover:bg-accent-400 hover:text-navy-950">
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>
        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h4 className="mb-4 font-display text-lg font-semibold text-white">{col.title}</h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.to}><Link to={l.to} className="transition hover:text-accent-300">{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <h4 className="mb-4 font-display text-lg font-semibold text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-accent-400" />{settings.site.address}</li>
            <li className="flex gap-3"><Phone size={16} className="shrink-0 text-accent-400" />{settings.site.phone}</li>
            <li className="flex gap-3"><Mail size={16} className="shrink-0 text-accent-400" />{settings.site.email}</li>
            <li className="flex gap-3"><Clock size={16} className="shrink-0 text-accent-400" />{settings.site.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.site.schoolName}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy-policy" className="hover:text-accent-300">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-accent-300">Terms & Conditions</Link>
            <Link to="/login" className="hover:text-accent-300">Staff Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

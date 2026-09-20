import { useSettings } from '../../context/SettingsContext.jsx';

export default function Logo({ light = false, compact = false }) {
  const { settings } = useSettings();
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 64 64" className="h-10 w-10 shrink-0 drop-shadow">
        <rect width="64" height="64" rx="14" fill={light ? 'rgba(255,255,255,0.12)' : '#0c1b3a'} />
        <path d="M32 10l18 7v13c0 11-8 19-18 24-10-5-18-13-18-24V17l18-7z" fill="none" stroke="#dbac33" strokeWidth="2.5" />
        <text x="32" y="40" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#dbac33" textAnchor="middle">R</text>
      </svg>
      {!compact && (
        <div className="leading-tight">
          <p className={`font-display text-lg font-semibold ${light ? 'text-white' : 'text-ink'}`}>{settings.site.schoolName}</p>
          <p className={`text-[11px] font-medium tracking-wide ${light ? 'text-white/70' : 'text-muted'}`}>SohanJani Tagan · Muzaffarnagar</p>
        </div>
      )}
    </div>
  );
}

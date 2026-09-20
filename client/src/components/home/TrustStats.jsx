import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Trophy, Users, GraduationCap, Award, Sparkles, Star } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useCountUp } from '../../hooks/useCountUp.js';

const DEFAULT_STATS = [
  { label: 'Years of Excellence', value: 15, suffix: '+' },
  { label: 'Students', value: 1200, suffix: '+' },
  { label: 'Qualified Teachers', value: 45, suffix: '+' },
  { label: 'Board Results', value: 98, suffix: '%' },
];

const iconFor = (label = '') => {
  const l = label.toLowerCase();
  if (l.includes('year')) return Trophy;
  if (l.includes('student')) return Users;
  if (l.includes('teacher') || l.includes('faculty')) return GraduationCap;
  if (l.includes('achiev') || l.includes('result') || l.includes('board')) return Award;
  if (l.includes('activit') || l.includes('program')) return Sparkles;
  return Star;
};

function Stat({ stat, active }) {
  const value = useCountUp(stat.value, active);
  const Icon = iconFor(stat.label);
  return (
    <div className="group relative p-6 text-center transition-colors hover:bg-white/5">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30 transition-transform duration-300 group-hover:scale-110">
        <Icon size={19} />
      </span>
      <p className="mt-3 font-display text-4xl font-bold text-accent-400 sm:text-[2.6rem]">{value.toLocaleString('en-IN')}{stat.suffix}</p>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">{stat.label}</p>
    </div>
  );
}

export default function TrustStats() {
  const { settings } = useSettings();
  const stats = settings.stats?.length ? settings.stats.slice(0, 5) : DEFAULT_STATS;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section id="stats" ref={ref} className="relative z-10 -mt-12 pb-4">
      <div className="container-x">
        <motion.div
          className="relative grid grid-cols-2 divide-x divide-white/10 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 shadow-lift ring-1 ring-white/10 sm:grid-cols-3 lg:grid-cols-5 [&>div:nth-child(n+3)]:max-sm:border-t [&>div:nth-child(n+3)]:max-sm:border-white/10"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 50% 120%, #c99a22 0, transparent 55%)' }} aria-hidden />
          {stats.map((s) => <Stat key={s.label} stat={s} active={inView} />)}
        </motion.div>
      </div>
    </section>
  );
}

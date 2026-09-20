import { CalendarDays, Clock, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fmtDate } from '../../utils/format.js';

export default function EventCard({ event }) {
  const d = new Date(event.date);
  const upcoming = d >= new Date(new Date().toDateString());
  return (
    <motion.article className="card group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}>
      <div className="relative h-48 overflow-hidden">
        <img src={event.image || '/images/hero-campus.jpg'} alt={event.title} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="glass rounded-xl px-3 py-1.5 text-center text-white">
            <span className="block font-display text-lg font-bold leading-none">{d.getDate()}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{d.toLocaleString('en', { month: 'short' })}</span>
          </span>
          <span className={`badge ${upcoming ? 'bg-emerald-400/90 text-navy-950' : 'bg-white/80 text-navy-900'}`}>{upcoming ? 'Upcoming' : 'Past'}</span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-accent-600">{event.category}</p>
        <h3 className="mt-1.5 font-display text-lg font-semibold text-ink">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{event.description}</p>
        <div className="mt-4 space-y-1.5 text-sm text-muted">
          {event.time && <p className="flex items-center gap-2"><Clock size={14} className="text-brand-500" />{event.time}</p>}
          <p className="flex items-center gap-2"><MapPin size={14} className="text-brand-500" />{event.location}</p>
        </div>
        {event.registrationRequired && (
          <Link to="/contact" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:gap-2.5 transition-all dark:text-brand-300">
            Register Interest <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </motion.article>
  );
}

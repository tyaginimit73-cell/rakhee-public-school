import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Consistent banner for interior pages
export default function PageHero({ title, subtitle, crumbs = [] }) {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 sm:py-20">
      <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #3d70ef 0, transparent 45%), radial-gradient(circle at 85% 70%, #dbac33 0, transparent 40%)' }} aria-hidden />
      <div className="pattern-dots absolute inset-0 opacity-50" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent" aria-hidden />
      <div className="container-x relative text-center">
        <motion.h1 className="heading-2 text-white" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>{title}</motion.h1>
        {subtitle && <motion.p className="mx-auto mt-3 max-w-2xl text-white/70" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>{subtitle}</motion.p>}
        {crumbs.length > 0 && (
          <motion.nav className="mt-5 flex items-center justify-center gap-1.5 text-sm text-white/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} aria-label="Breadcrumb">
            <Link to="/" className="font-medium hover:text-accent-300">Home</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5">
                <ChevronRight size={14} />
                {c.to ? <Link to={c.to} className="font-medium hover:text-accent-300">{c.label}</Link> : <span className="text-accent-300">{c.label}</span>}
              </span>
            ))}
          </motion.nav>
        )}
      </div>
    </section>
  );
}

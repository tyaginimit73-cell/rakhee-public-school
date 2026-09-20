import { motion } from 'framer-motion';

export default function SectionHeading({ eyebrow, title, subtitle, center = true, light = false }) {
  return (
    <motion.div
      className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}
      initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55 }}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className={`heading-2 mt-4 ${light ? 'text-white' : 'text-ink'}`}>{title}</h2>
      <div className={`mt-5 flex items-center gap-2 ${center ? 'justify-center' : ''}`} aria-hidden>
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-accent-400" />
        <span className="h-1.5 w-1.5 rotate-45 bg-accent-400" />
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-accent-400" />
      </div>
      {subtitle && <p className={`mt-4 text-lg leading-relaxed ${light ? 'text-white/70' : 'text-muted'}`}>{subtitle}</p>}
    </motion.div>
  );
}

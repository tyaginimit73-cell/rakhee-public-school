import { motion, AnimatePresence } from 'framer-motion';

// Branded page-load intro — shown once per session (~1.9s)
export default function IntroLoader({ done }) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-navy-950"
          exit={{ opacity: 0, transition: { duration: 0.55, delay: 0.15, ease: 'easeInOut' } }}
        >
          {/* ambient glow */}
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 50% 35%, #2754e3 0, transparent 45%), radial-gradient(circle at 50% 90%, #c99a22 0, transparent 40%)' }} aria-hidden />

          {/* emblem draws itself */}
          <motion.svg viewBox="0 0 64 64" className="relative h-24 w-24" exit={{ scale: 1.15, transition: { duration: 0.5 } }}>
            <motion.path
              d="M32 10l18 7v13c0 11-8 19-18 24-10-5-18-13-18-24V17l18-7z"
              fill="none" stroke="#dbac33" strokeWidth="2.5" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.85, ease: 'easeInOut' }}
            />
            <motion.text
              x="32" y="40" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#dbac33" textAnchor="middle"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.35 }}>
              R
            </motion.text>
          </motion.svg>

          <motion.p
            className="relative mt-6 font-display text-2xl font-semibold tracking-wide text-white sm:text-3xl"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}>
            Rakhee Public School
          </motion.p>

          {/* gold rule expands */}
          <motion.div className="relative mt-3 h-px w-40 origin-center bg-gradient-to-r from-transparent via-accent-400 to-transparent"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }} />

          <motion.p className="relative mt-3 text-[11px] font-bold uppercase tracking-[0.35em] text-white/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            SohanJani Tagan · Muzaffarnagar
          </motion.p>

          {/* loading bar */}
          <div className="relative mt-8 h-1 w-44 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 via-accent-400 to-accent-500"
              initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.15 }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

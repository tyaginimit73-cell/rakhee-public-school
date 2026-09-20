import { motion, useScroll, useSpring } from 'framer-motion';

// Thin gold progress bar under the navbar
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-brand-500 via-accent-400 to-accent-500"
      style={{ scaleX }}
      aria-hidden
    />
  );
}

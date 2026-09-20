import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, Sparkles, HeartHandshake, ArrowRight, MapPin, GraduationCap, Phone, ChevronDown } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 26 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay } });

const EXTRA_SLIDES = ['/images/campus/assembly.jpg', '/images/campus/cultural.jpg'];

export default function Hero() {
  const { settings } = useSettings();
  const slides = [settings.hero.image || '/images/hero-campus.jpg', ...EXTRA_SLIDES];

  // ---- crossfade slideshow ----
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5200);
    return () => clearInterval(t);
  }, [slides.length]);

  // ---- mouse parallax ----
  const sectionRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 16, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 55, damping: 16, mass: 0.6 });
  const frameX = useTransform(sx, (v) => v * 16);
  const frameY = useTransform(sy, (v) => v * 12);
  const cardsX = useTransform(sx, (v) => v * -26);
  const cardsY = useTransform(sy, (v) => v * -20);

  const onMouseMove = (e) => {
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onMouseLeave = () => { mx.set(0); my.set(0); };

  const floating = [
    { icon: GraduationCap, title: 'Academic Excellence', note: 'Strong results, strong foundations', pos: 'left-0 top-8', delay: 0.9 },
    { icon: ShieldCheck, title: 'Safe & Supportive Campus', note: 'CCTV, care & discipline', pos: 'right-0 top-24', delay: 1.05 },
    { icon: HeartHandshake, title: 'Holistic Development', note: 'Sports, arts & life skills', pos: 'bottom-10 left-10', delay: 1.2 },
  ];

  return (
    <section ref={sectionRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className="relative overflow-hidden bg-navy-950 text-white">
      {/* animated backdrop */}
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, #2754e3 0, transparent 42%), radial-gradient(circle at 90% 75%, #c99a22 0, transparent 38%)' }} />
        <div className="pattern-dots absolute inset-0 opacity-40" />
        <motion.div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" animate={{ y: [0, -30, 0] }} transition={{ duration: 9, repeat: Infinity }} />
        <motion.div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-accent-500/15 blur-3xl" animate={{ y: [0, 30, 0] }} transition={{ duration: 11, repeat: Infinity }} />
      </div>

      <div className="container-x relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-24">
        {/* Copy */}
        <div>
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2.5 rounded-full border border-accent-400/40 bg-accent-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
            </span>
            {settings.admissionOpen ? 'Admissions Open 2026–27' : 'Welcome'}
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="heading-1 mt-5">
            {settings.site.schoolName}
          </motion.h1>
          <motion.p {...fadeUp(0.18)} className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/70">
            <MapPin size={15} className="text-accent-400" /> SohanJani Tagan · Muzaffarnagar · Uttar Pradesh
          </motion.p>

          <motion.p {...fadeUp(0.26)} className="mt-6 font-display text-2xl font-medium leading-snug sm:text-4xl">
            <span className="text-white">Inspiring Young Minds.</span>
            <br />
            <span className="text-shimmer">Building Bright Futures.</span>
          </motion.p>
          <motion.p {...fadeUp(0.34)} className="mt-4 max-w-xl leading-relaxed text-white/70">
            {settings.hero.subtext}
          </motion.p>

          <motion.div {...fadeUp(0.42)} className="mt-8 flex flex-wrap gap-3">
            <Link to="/admissions/apply" className="btn-accent">Admissions Open <GraduationCap size={16} /></Link>
            <Link to="/about" className="btn-white">Explore Our School <ArrowRight size={16} /></Link>
            <Link to="/contact" className="btn-white"><Phone size={15} /> Contact Us</Link>
          </motion.div>

          <motion.div {...fadeUp(0.55)} className="mt-10 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            <span className="h-px w-10 bg-gradient-to-r from-accent-400 to-transparent" />
            A community of learners, in the heart of Muzaffarnagar
          </motion.div>
        </div>

        {/* Visual — parallax frame + crossfade slideshow */}
        <motion.div className="relative" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }}>
          <motion.div className="relative mx-auto max-w-xl" style={{ x: frameX, y: frameY }}>
            <div className="absolute -inset-5 rounded-[2.5rem] border-2 border-dashed border-accent-400/20 animate-spin-slower" aria-hidden />
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-accent-400/40 via-brand-500/20 to-transparent blur-md" aria-hidden />

            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/20 shadow-lift">
              <AnimatePresence initial={false}>
                <motion.img
                  key={slides[slide]}
                  src={slides[slide]}
                  alt="Rakhee Public School campus life"
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                />
              </AnimatePresence>
              {/* slide dots */}
              <div className="absolute bottom-4 right-5 z-10 flex gap-1.5">
                {slides.map((s, i) => (
                  <button key={s} type="button" onClick={() => setSlide(i)} aria-label={`Show photo ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-6 bg-accent-400' : 'w-1.5 bg-white/50 hover:bg-white/80'}`} />
                ))}
              </div>
            </div>

            {/* floating cards — counter-parallax for depth */}
            <motion.div style={{ x: cardsX, y: cardsY }} className="absolute inset-0">
              {floating.map(({ icon: Icon, title, note, pos, delay }) => (
                <motion.div key={title}
                  className={`absolute ${pos} glass hidden w-52 rounded-2xl p-4 shadow-lift sm:block`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
                  <div className="animate-floaty">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-300 to-accent-500 text-navy-950 shadow"><Icon size={18} /></span>
                    <p className="mt-2 text-sm font-bold text-white">{title}</p>
                    <p className="text-xs text-white/70">{note}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.a href="#stats" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-white/40 transition-colors hover:text-accent-300 md:flex"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} aria-label="Scroll down">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
        <ChevronDown size={16} className="animate-bounce-soft" />
      </motion.a>

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy-950 to-transparent" aria-hidden />
    </section>
  );
}

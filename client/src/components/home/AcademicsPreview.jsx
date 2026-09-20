import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Baby, Blocks, FlaskConical, Landmark, ArrowRight,
         Sigma, Microscope, BookOpen, Languages, Globe2, Cpu, Medal, Palette } from 'lucide-react';
import SectionHeading from '../common/SectionHeading.jsx';

const LEVELS = [
  { icon: Baby, title: 'Pre-Primary', note: 'Play-based foundations in a joyful, caring setting.', classes: 'Nursery – UKG' },
  { icon: Blocks, title: 'Primary', note: 'Strong literacy, numeracy and curiosity through activity-based learning.', classes: 'Class 1 – 5' },
  { icon: FlaskConical, title: 'Middle School', note: 'Concept clarity, labs and discovery-led science and maths.', classes: 'Class 6 – 8' },
  { icon: Landmark, title: 'Secondary', note: 'Rigorous board preparation with mentoring and regular assessments.', classes: 'Class 9 – 10' },
];

const SUBJECTS = [
  { icon: Sigma, name: 'Mathematics' }, { icon: Microscope, name: 'Science' },
  { icon: BookOpen, name: 'English' }, { icon: Languages, name: 'Hindi' },
  { icon: Globe2, name: 'Social Science' }, { icon: Cpu, name: 'Computer Science' },
  { icon: Medal, name: 'Physical Education' }, { icon: Palette, name: 'Arts' },
];

export default function AcademicsPreview() {
  return (
    <section className="section relative overflow-hidden bg-navy-950 text-white">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, #2754e3 0, transparent 40%), radial-gradient(circle at 10% 90%, #c99a22 0, transparent 35%)' }} aria-hidden />
      <div className="container-x relative">
        <SectionHeading light eyebrow="Academics" title="Learning designed for every stage" subtitle="A carefully sequenced curriculum from early years to board classes, taught with care and modern methods." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map(({ icon: Icon, title, note, classes }, i) => (
            <motion.div key={title} className="group rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-accent-400/50 hover:bg-white/10"
              initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: i * 0.08, duration: 0.5 }}>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-400/15 text-accent-300"><Icon size={22} /></span>
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-accent-300/80">{classes}</p>
              <p className="mt-2.5 text-sm leading-relaxed text-white/65">{note}</p>
            </motion.div>
          ))}
        </div>
        <motion.div className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          {SUBJECTS.map(({ icon: Icon, name }) => (
            <span key={name} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-accent-400/60 hover:text-white">
              <Icon size={15} className="text-accent-300" /> {name}
            </span>
          ))}
        </motion.div>
        <div className="mt-10 text-center">
          <Link to="/academics" className="btn-accent">Explore Academics <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
}

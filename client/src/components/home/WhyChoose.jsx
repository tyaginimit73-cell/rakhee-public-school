import { motion } from 'framer-motion';
import { GraduationCap, Users, HeartHandshake, ShieldCheck, MonitorSmartphone, Trophy } from 'lucide-react';
import SectionHeading from '../common/SectionHeading.jsx';

const FEATURES = [
  { icon: GraduationCap, title: 'Academic Excellence', text: 'Strong academic foundation and student-focused learning that consistently delivers outstanding results.' },
  { icon: Users, title: 'Experienced Faculty', text: 'Dedicated, qualified and caring teachers who mentor every child personally.' },
  { icon: HeartHandshake, title: 'Holistic Development', text: 'Academic, physical, creative and social growth — the complete child.' },
  { icon: ShieldCheck, title: 'Safe Environment', text: 'A secure, disciplined and supportive campus where parents have peace of mind.' },
  { icon: MonitorSmartphone, title: 'Modern Learning', text: 'Technology-supported classrooms and digital learning resources.' },
  { icon: Trophy, title: 'Co-Curricular Activities', text: 'Sports, cultural events, competitions and creative learning beyond the classroom.' },
];

export default function WhyChoose() {
  return (
    <section className="section bg-line/30 dark:bg-navy-900/40">
      <div className="container-x">
        <SectionHeading eyebrow="Why Choose Us" title="Why families choose Rakhee Public School" subtitle="Everything we do is designed around one goal — helping your child thrive." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <motion.div key={title} className="card group relative overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:shadow-lift before:absolute before:inset-x-0 before:top-0 before:h-1 before:origin-left before:scale-x-0 before:bg-gradient-to-r before:from-brand-500 before:via-accent-400 before:to-brand-500 before:transition-transform before:duration-500 hover:before:scale-x-100"
              initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}>
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-600/5 transition-transform duration-500 group-hover:scale-[2.6]" aria-hidden />
              <span className="relative grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-navy-900 p-3.5 text-accent-300 shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:shadow-glow">
                <Icon size={24} />
              </span>
              <h3 className="relative mt-5 font-display text-xl font-semibold">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

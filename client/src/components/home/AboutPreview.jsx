import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Quote, Target, Compass, Gem } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import SectionHeading from '../common/SectionHeading.jsx';

export default function AboutPreview() {
  const { settings } = useSettings();
  const { about, principal, site } = settings;
  return (
    <section className="section">
      <div className="container-x">
        <SectionHeading eyebrow="About Our School" title={`A tradition of care & excellence in Muzaffarnagar`} />
        <div className="mt-12 grid items-start gap-8 lg:grid-cols-5">
          <motion.div className="space-y-6 lg:col-span-3" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-lg leading-relaxed text-muted">{about.intro}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Target, title: 'Our Mission', text: about.mission },
                { icon: Compass, title: 'Our Vision', text: about.vision },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="card p-6 transition-all hover:-translate-y-1 hover:shadow-lift">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-300"><Icon size={20} /></span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
            {about.values?.length > 0 && (
              <div className="card flex flex-wrap items-center gap-2 p-5">
                <Gem size={18} className="text-accent-500" />
                <span className="text-sm font-bold">Core values:</span>
                {about.values.map((v) => <span key={v} className="badge bg-line/50 text-ink">{v}</span>)}
              </div>
            )}
            <Link to="/about" className="btn-primary">Read Our Story <ArrowRight size={16} /></Link>
          </motion.div>

          {/* Principal card */}
          <motion.aside className="lg:col-span-2" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}>
            <div className="card overflow-hidden">
              <div className="relative h-60 overflow-hidden">
                <img src={principal.photo || '/images/principal.jpg'} alt={`${principal.designation} of ${site.schoolName}`} className="h-full w-full object-cover object-top" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <p className="font-display text-lg font-semibold">{principal.name}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-accent-300">{principal.designation}</p>
                </div>
              </div>
              <div className="relative p-6">
                <Quote size={26} className="absolute -top-3.5 right-6 text-accent-400" fill="currentColor" />
                <p className="text-sm italic leading-relaxed text-muted line-clamp-6">“{principal.message}”</p>
                <Link to="/about#principal" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:gap-2.5 transition-all dark:text-brand-300">Principal's Message <ArrowRight size={14} /></Link>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}

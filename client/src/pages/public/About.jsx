import { motion } from 'framer-motion';
import { Target, Compass, Gem, Quote, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function About() {
  usePageMeta('About Us', 'Our history, mission and leadership at Rakhee Public School.');
  const { settings } = useSettings();
  const { about, principal, site } = settings;
  return (
    <>
      <PageHero title="About Rakhee Public School" subtitle="A community where learning, character and confidence grow together." crumbs={[{ label: 'About' }]} />

      <section className="section">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -26 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="eyebrow">Who We Are</span>
            <h2 className="heading-2 mt-4">Rooted in values, focused on the future</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{about.intro}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: GraduationCap, label: 'Academic Rigor' },
                { icon: ShieldCheck, label: 'Safe Campus' },
                { icon: Sparkles, label: 'Joyful Learning' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="card flex flex-col items-center gap-2 p-4 text-center">
                  <Icon size={22} className="text-brand-600 dark:text-brand-300" />
                  <span className="text-sm font-bold">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div className="relative" initial={{ opacity: 0, x: 26 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-accent-400/30 to-brand-600/20 blur-lg" aria-hidden />
            <img src="/images/hero-campus.jpg" alt="Rakhee Public School campus view" className="relative w-full rounded-[2rem] border border-line object-cover shadow-lift" loading="lazy" />
          </motion.div>
        </div>
      </section>

      <section className="section bg-line/30 dark:bg-navy-900/40">
        <div className="container-x">
          <SectionHeading eyebrow="Our Compass" title="Vision, mission & values" />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              { icon: Compass, title: 'Our Vision', text: about.vision, tone: 'from-brand-600 to-navy-900' },
              { icon: Target, title: 'Our Mission', text: about.mission, tone: 'from-accent-500 to-accent-700' },
              { icon: Gem, title: 'Core Values', text: '', tone: 'from-navy-800 to-navy-950', values: about.values },
            ].map(({ icon: Icon, title, text, tone, values }) => (
              <motion.div key={title} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tone} p-8 text-white shadow-lift`}
                initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" aria-hidden />
                <Icon size={30} className="text-accent-300" />
                <h3 className="mt-4 font-display text-2xl font-semibold">{title}</h3>
                {text && <p className="mt-3 leading-relaxed text-white/80">{text}</p>}
                {values && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {values.map((v) => <span key={v} className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">{v}</span>)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="principal" className="section scroll-mt-24">
        <div className="container-x">
          <SectionHeading eyebrow="From the Principal's Desk" title="A word of welcome" />
          <motion.div className="mx-auto mt-12 grid max-w-4xl overflow-hidden rounded-3xl border border-line bg-surface shadow-lift md:grid-cols-3"
            initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="relative">
              <img src={principal.photo || '/images/principal.jpg'} alt={`${principal.name}, ${principal.designation}`} className="h-full w-full object-cover object-top" loading="lazy" />
            </div>
            <div className="relative p-8 md:col-span-2">
              <Quote size={34} className="text-accent-400" fill="currentColor" />
              <p className="mt-4 text-lg italic leading-relaxed text-muted">{principal.message}</p>
              <div className="mt-6 border-t border-line pt-5">
                <p className="font-display text-xl font-semibold">{principal.name}</p>
                <p className="text-sm font-bold uppercase tracking-widest text-accent-600">{principal.designation}, {site.schoolName}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-x">
          <div className="card grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Established', site.establishedYear], ['Affiliation', site.affiliation],
              ['Board', site.board], ['School Hours', site.hours],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs font-bold uppercase tracking-widest text-muted">{k}</p>
                <p className="mt-1 font-semibold text-ink">{v || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

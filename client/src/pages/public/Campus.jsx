import { motion } from 'framer-motion';
import { MonitorSmartphone, FlaskConical, Cpu, Library, Trophy, BedDouble, Palette, ShieldCheck, Droplets, ClipboardList } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import FacilitiesChecklist from '../../components/campus/FacilitiesChecklist.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const FACILITIES = [
  { icon: MonitorSmartphone, title: 'Smart Classrooms', text: 'Bright, airy classrooms with teaching aids and activity corners.', img: '/images/campus/classroom.jpg' },
  { icon: FlaskConical, title: 'Science Laboratories', text: 'Well-equipped labs for hands-on, practical learning.', img: '/images/campus/lab.jpg' },
  { icon: Cpu, title: 'Computer Lab & IT', text: 'Modern IT infrastructure where students build real digital skills.', img: '/images/campus/classroom.jpg' },
  { icon: Library, title: 'Library', text: 'A quiet, well-stocked library that builds a lifelong reading habit.', img: '/images/campus/library.jpg' },
  { icon: Trophy, title: 'Sports & Yoga', text: 'Sports day, yoga activity and extra-curricular programmes for fitness.', img: '/images/campus/sports-action.jpg' },
  { icon: BedDouble, title: 'Hostel Facility', text: 'Safe and supervised hostel accommodation for out-station students.', img: '/images/hero-campus.jpg' },
  { icon: Palette, title: 'Art & Activities', text: 'Art & craft, dancing, music competitions and festival celebrations.', img: '/images/campus/cultural.jpg' },
  { icon: ShieldCheck, title: 'Safety & Medical', text: 'CCTV-monitored campus with medical facility and health check-ups.', img: '/images/hero-campus.jpg' },
  { icon: Droplets, title: 'Drinking Water & Hygiene', text: 'Clean drinking water and well-maintained toilet facilities.', img: '/images/campus/classroom.jpg' },
];

export default function Campus() {
  usePageMeta('Campus & Facilities', 'Infrastructure and facilities at Rakhee Public School — labs, library, sports and more.');
  const { settings } = useSettings();
  return (
    <>
      <PageHero title="Our Campus" subtitle="A safe, green and modern environment designed for joyful learning." crumbs={[{ label: 'Campus' }]} />
      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Facilities" title="Everything a growing mind needs" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FACILITIES.map(({ icon: Icon, title, text, img }, i) => (
              <motion.article key={title} className="card group overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
                initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: (i % 3) * 0.08 }}>
                <div className="relative h-52 overflow-hidden">
                  <img src={img} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/10 to-transparent opacity-80 transition-opacity group-hover:opacity-95" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-3 text-white">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-400 text-navy-950 shadow"><Icon size={19} /></span>
                    <h3 className="font-display text-xl font-semibold drop-shadow">{title}</h3>
                  </div>
                </div>
                <p className="p-5 text-sm leading-relaxed text-muted">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-line/30 dark:bg-navy-900/40">
        <div className="container-x">
          <SectionHeading eyebrow="At a Glance" title="Facilities & Activities"
            subtitle="A transparent view of what's available at Rakhee Public School — maintained by the school office." />
          <div className="mt-10">
            <FacilitiesChecklist data={settings.facilities} />
          </div>
          <p className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 text-center text-xs text-muted">
            <ClipboardList size={14} className="shrink-0" />
            This list is updated by the school administration. Please verify specific facilities at the time of admission.
          </p>
        </div>
      </section>
    </>
  );
}

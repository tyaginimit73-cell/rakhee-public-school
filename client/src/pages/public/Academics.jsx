import { motion } from 'framer-motion';
import { Baby, Blocks, FlaskConical, Landmark, Sigma, Microscope, BookOpen, Languages, Globe2, Cpu, Medal, Palette, ClipboardCheck, Lightbulb, GraduationCap } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const LEVELS = [
  { icon: Baby, title: 'Pre-Primary (Nursery – UKG)', points: ['Play-based, activity-led foundations', 'Phonics, rhymes, motor skills & storytelling', 'Gentle introduction to numbers and letters'] },
  { icon: Blocks, title: 'Primary (Class 1 – 5)', points: ['Strong reading, writing and arithmetic', 'EVS, hands-on activities & value education', 'Weekly assessments with caring feedback'] },
  { icon: FlaskConical, title: 'Middle School (Class 6 – 8)', points: ['Concept-first science & mathematics', 'Lab work, projects and presentations', 'Digital literacy and communication skills'] },
  { icon: Landmark, title: 'Secondary (Class 9 – 10)', points: ['Board-focused, structured preparation', 'Regular tests, mentoring and revision cycles', 'Career awareness and study skills'] },
];

const SUBJECT_ICONS = { Mathematics: Sigma, Science: Microscope, English: BookOpen, Hindi: Languages, 'Social Science': Globe2, 'Computer Science': Cpu, 'Physical Education': Medal, Arts: Palette, EVS: Microscope };

export default function Academics() {
  usePageMeta('Academics', 'Curriculum and class structure from Pre-Primary to Class 10 at Rakhee Public School.');
  const { data } = useFetch('/classes');
  const classes = data?.items || [];
  const allSubjects = [...new Set(classes.flatMap((c) => c.subjects || []))];
  const subjects = allSubjects.length ? allSubjects : Object.keys(SUBJECT_ICONS);

  return (
    <>
      <PageHero title="Academics" subtitle="A thoughtfully sequenced curriculum that builds strong foundations and board-ready confidence." crumbs={[{ label: 'Academics' }]} />

      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Our Philosophy" title="Concepts first. Every child, every day."
            subtitle="We teach for understanding, not memorisation — with activity-based learning in early years and disciplined, exam-ready rigour in senior classes." />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {LEVELS.map(({ icon: Icon, title, points }, i) => (
              <motion.div key={title} className="card group p-7 transition-all hover:-translate-y-1 hover:shadow-lift"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: (i % 2) * 0.1 }}>
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 text-accent-300"><Icon size={22} /></span>
                  <h3 className="font-display text-xl font-semibold">{title}</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {points.map((p) => <li key={p} className="flex gap-2.5"><GraduationCap size={15} className="mt-0.5 shrink-0 text-accent-500" />{p}</li>)}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-line/30 dark:bg-navy-900/40">
        <div className="container-x">
          <SectionHeading eyebrow="Subjects" title="A rich, balanced curriculum" subtitle="Managed live from the school admin panel." />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {subjects.map((name, i) => {
              const Icon = SUBJECT_ICONS[name] || BookOpen;
              return (
                <motion.div key={name} className="card flex items-center gap-3 p-5 transition-all hover:-translate-y-1 hover:shadow-lift"
                  initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: (i % 4) * 0.06 }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-300"><Icon size={19} /></span>
                  <span className="font-semibold">{name}</span>
                </motion.div>
              );
            })}
          </div>
          {classes.length > 0 && (
            <div className="mt-12 overflow-hidden rounded-2xl border border-line shadow-soft">
              <table className="table bg-surface">
                <thead><tr><th>Class</th><th>Level</th><th>Subjects</th><th>Class Teacher</th><th>Strength</th></tr></thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c._id}>
                      <td className="font-bold">{c.name} {c.section !== 'A' ? `(${c.section})` : ''}</td>
                      <td><span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">{c.level}</span></td>
                      <td className="max-w-xs"><span className="line-clamp-1 text-muted">{c.subjects?.join(', ')}</span></td>
                      <td>{c.classTeacher?.name || '—'}</td>
                      <td>{c.studentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-8 lg:grid-cols-2">
          {[
            { icon: Lightbulb, title: 'Teaching Methodology', points: ['Activity and demonstration-based lessons', 'Smart-class supported concept visualization', 'Regular doubt-clearing and remedial support', 'Communication, projects and presentation skills'] },
            { icon: ClipboardCheck, title: 'Assessment System', points: ['Continuous weekly and monthly evaluations', 'Unit tests, half-yearly and annual examinations', 'Structured report cards with remedial guidance', 'Parent-teacher reviews every term'] },
          ].map(({ icon: Icon, title, points }) => (
            <motion.div key={title} className="card p-8" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-400/15 text-accent-600"><Icon size={22} /></span>
              <h3 className="mt-4 font-display text-2xl font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2.5 text-muted">
                {points.map((p) => <li key={p} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />{p}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

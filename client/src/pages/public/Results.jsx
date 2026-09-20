import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Printer, Award, BadgeCheck, UserRound } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import { Field, Input } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/StateViews.jsx';
import api from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { cx } from '../../utils/format.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const gradeColor = (pct) => (pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-brand-600' : pct >= 40 ? 'text-amber-500' : 'text-red-500');

export default function Results() {
  usePageMeta('Check Results', 'Check your child\'s examination results online using roll number and date of birth.');
  const { settings } = useSettings();
  const [rollNumber, setRoll] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);

  const check = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setPayload(null);
    try {
      const { data } = await api.post('/results/check', { rollNumber, dob });
      setPayload(data.data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const { result, student } = payload || {};

  return (
    <>
      <PageHero title="Student Results" subtitle="Enter the Roll Number and Date of Birth to view the latest published report card." crumbs={[{ label: 'Results' }]} />
      <section className="section">
        <div className="container-x max-w-3xl">
          <form onSubmit={check} className="card space-y-4 p-6 sm:p-8 no-print" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Roll Number / Student ID" required>
                <Input placeholder="e.g. RPS1001" value={rollNumber} onChange={(e) => setRoll(e.target.value.toUpperCase())} />
              </Field>
              <Field label="Date of Birth" required>
                <Input type="date" max={new Date().toISOString().slice(0, 10)} value={dob} onChange={(e) => setDob(e.target.value)} />
              </Field>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading || !rollNumber || !dob}>
              {loading ? <ButtonSpinner /> : <Search size={16} />} View Result
            </button>
          </form>

          {error && <div className="mt-6 no-print"><ErrorState title="Result unavailable" message={error} /></div>}

          {result && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="print-area card mt-8 overflow-hidden">
              {/* Report card header */}
              <div className="bg-gradient-to-r from-brand-800 to-navy-950 p-6 text-white sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-accent-300">{result.exam} · Session {result.session}</p>
                    <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{settings.site.schoolName}</h2>
                    <p className="text-sm text-white/70">{settings.site.address}</p>
                  </div>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-400 text-navy-950"><Award size={28} /></span>
                </div>
              </div>

              <div className="grid gap-4 border-b border-line bg-line/20 p-6 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <UserRound size={18} className="text-brand-600 dark:text-brand-300" />
                  <div><p className="text-xs font-bold uppercase text-muted">Student</p><p className="font-bold">{student.name}</p></div>
                </div>
                <div><p className="text-xs font-bold uppercase text-muted">Class</p><p className="font-bold">{student.class?.name} {student.class?.section ? `(${student.class.section})` : ''}</p></div>
                <div><p className="text-xs font-bold uppercase text-muted">Roll Number</p><p className="font-bold">{student.rollNumber}</p></div>
              </div>

              <div className="p-6 sm:p-8">
                <table className="table">
                  <thead><tr><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {result.subjects.map((s) => {
                      const pct = (s.obtainedMarks / s.maxMarks) * 100;
                      return (
                        <tr key={s.name}>
                          <td className="font-semibold">{s.name}</td>
                          <td>{s.maxMarks}</td>
                          <td className={cx('font-bold', gradeColor(pct))}>{s.obtainedMarks}</td>
                          <td><span className="text-xs font-semibold text-muted">{pct >= 75 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Satisfactory' : 'Needs Improvement'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                  {[
                    ['Total', `${result.totalObtained} / ${result.totalMax}`],
                    ['Percentage', `${result.percentage}%`],
                    ['Grade', result.grade],
                    ['Result', result.status],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-line bg-line/20 p-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted">{k}</p>
                      <p className={cx('mt-1 font-display text-2xl font-bold', k === 'Result' ? (v === 'Pass' ? 'text-emerald-600' : 'text-red-500') : 'text-ink')}>{v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                  <p className="text-xs italic text-muted">This is a computer-generated report card. For the signed original, please contact the school office.</p>
                  <button type="button" onClick={() => window.print()} className="btn-outline btn-sm no-print"><Printer size={14} /> Print</button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, Circle, ClipboardList } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import { Field, Input } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/StateViews.jsx';
import api from '../../services/api.js';
import { fmtDate, fmtDateTime, cx, ADMISSION_STATUSES, statusColor } from '../../utils/format.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function TrackApplication() {
  usePageMeta('Track Application', 'Track the status of your admission application to Rakhee Public School.');
  const [params] = useSearchParams();
  const [applicationId, setApplicationId] = useState(params.get('id') || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const track = async (e) => {
    e?.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.get(`/admissions/track?applicationId=${encodeURIComponent(applicationId)}&phone=${encodeURIComponent(phone)}`);
      setResult(data.data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <>
      <PageHero title="Track Your Application" subtitle="Enter your Application ID and registered phone number to see the live status." crumbs={[{ label: 'Admissions', to: '/admissions' }, { label: 'Track' }]} />
      <section className="section">
        <div className="container-x max-w-2xl">
          <form onSubmit={track} className="card space-y-4 p-6 sm:p-8" noValidate>
            <Field label="Application ID" required><Input placeholder="e.g. RPS-2026-0001" value={applicationId} onChange={(e) => setApplicationId(e.target.value.toUpperCase())} /></Field>
            <Field label="Registered Phone Number" required><Input placeholder="Phone used during application" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <button type="submit" className="btn-primary w-full" disabled={loading || !applicationId || !phone}>
              {loading ? <ButtonSpinner /> : <Search size={16} />} Track Status
            </button>
          </form>

          {error && <div className="mt-6"><ErrorState title="Application not found" message={error} /></div>}

          {result && (
            <motion.div className="card mt-6 overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="border-b border-line bg-line/20 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">{result.applicationId}</p>
                    <h2 className="font-display text-2xl font-semibold">{result.studentName}</h2>
                    <p className="text-sm text-muted">Applying for {result.classApplyingFor} · Submitted {fmtDate(result.createdAt)}</p>
                  </div>
                  <span className={cx('badge px-4 py-1.5 text-sm', statusColor[result.status])}>{result.status}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-bold"><ClipboardList size={17} className="text-brand-600 dark:text-brand-300" /> Status Timeline</h3>
                <ol className="relative space-y-5 border-l-2 border-line pl-6">
                  {(result.statusHistory || []).slice().reverse().map((h, i) => (
                    <li key={i} className="relative">
                      <span className={cx('absolute -left-[31px] top-0.5 grid h-5 w-5 place-items-center rounded-full', i === 0 ? 'bg-brand-600 text-white' : 'bg-line text-muted')}>
                        {i === 0 ? <CheckCircle2 size={12} /> : <Circle size={10} />}
                      </span>
                      <p className="font-semibold text-ink">{h.status}</p>
                      <p className="text-xs text-muted">{fmtDateTime(h.at)}</p>
                    </li>
                  ))}
                </ol>
                {result.status === 'Approved' && (
                  <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    🎉 Congratulations! Please visit the school office with original documents to complete admission formalities.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}

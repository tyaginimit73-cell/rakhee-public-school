import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut, UserRound, CalendarCheck, FileText, Wallet, Megaphone, FolderOpen,
  GraduationCap, ChevronRight, FileDown, MapPin, CalendarDays,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import Logo from '../../components/common/Logo.jsx';
import ThemeToggle from '../../components/common/ThemeToggle.jsx';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/StateViews.jsx';
import NoticeCard from '../../components/cards/NoticeCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import api from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { fmtDate, inr, initials, cx, statusColor } from '../../utils/format.js';

const TABS = [
  { id: 'overview', label: 'Overview', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'results', label: 'Results', icon: FileText },
  { id: 'fees', label: 'Fees', icon: Wallet },
  { id: 'notices', label: 'Notices & Documents', icon: Megaphone },
];

const tooltipStyle = { borderRadius: 12, border: '1px solid rgb(var(--line))', background: 'rgb(var(--surface))', color: 'rgb(var(--ink))', fontSize: 13 };
const gradeColor = (pct) => (pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-brand-600' : pct >= 40 ? 'text-amber-500' : 'text-red-500');

export default function PortalDashboard() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const { data, loading, error, refetch } = useFetch('/portal/overview');

  const doLogout = async () => { await logout(); navigate('/login'); };

  if (loading) return <FullPageLoader label="Loading your portal…" />;
  if (error) return <div className="section"><div className="container-x"><ErrorState message={error} onRetry={refetch} /></div></div>;

  const { student, attendance, results = [], fees = [], notices = [], events = [], documents = [], message } = data || {};
  const overall = attendance?.overall || { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
  const pieData = [
    { name: 'Present', value: overall.present },
    { name: 'Absent', value: overall.absent },
    { name: 'Late', value: overall.late },
  ];
  const latestResult = results[0];
  const totalPending = fees.reduce((s, f) => s + (f.pendingAmount || 0), 0);

  return (
    <div className="min-h-screen bg-base">
      {/* Portal header */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-3">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-3 rounded-xl border border-line px-3 py-1.5 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400 text-xs font-bold text-navy-950">{initials(user?.name)}</span>
              <div className="leading-tight">
                <p className="text-sm font-bold">{user?.name}</p>
                <p className="text-[11px] font-semibold capitalize text-muted">{user?.role} portal</p>
              </div>
            </div>
            <button type="button" className="btn-icon" onClick={doLogout} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <div className="container-x py-8">
        {/* Tab bar */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={cx('flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                tab === id ? 'bg-brand-600 text-white shadow-soft' : 'border border-line bg-surface text-muted hover:text-ink')}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {!student && (
          <div className="card mx-auto max-w-lg p-8 text-center">
            <UserRound size={40} className="mx-auto text-muted" />
            <h2 className="mt-4 font-display text-2xl font-semibold">Account not yet linked</h2>
            <p className="mt-2 text-sm text-muted">{message || 'Please contact the school office to link your account to a student record.'}</p>
          </div>
        )}

        {student && (
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* ============ OVERVIEW ============ */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="card flex flex-wrap items-center gap-5 bg-gradient-to-r from-brand-800 to-navy-950 p-6 text-white sm:p-8" style={{ border: 'none' }}>
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-400 font-display text-2xl font-bold text-navy-950">{initials(student.fullName)}</span>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-semibold">{student.fullName}</h2>
                    <p className="text-white/70">{student.class?.name} ({student.class?.section}) · Roll No {student.rollNumber}</p>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div><p className="font-display text-2xl font-bold text-accent-300">{overall.percentage}%</p><p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Attendance</p></div>
                    <div><p className="font-display text-2xl font-bold text-accent-300">{latestResult ? `${latestResult.grade}` : '—'}</p><p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Latest Grade</p></div>
                    <div><p className="font-display text-2xl font-bold text-accent-300">{inr(totalPending)}</p><p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Fees Due</p></div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="card p-6">
                    <h3 className="mb-4 font-display text-lg font-semibold">Latest Notices</h3>
                    <div className="space-y-3">
                      {notices.slice(0, 3).map((n) => <NoticeCard key={n._id} notice={n} compact />)}
                    </div>
                  </div>
                  <div className="card p-6">
                    <h3 className="mb-4 font-display text-lg font-semibold">Upcoming Events</h3>
                    <ul className="space-y-3">
                      {events.length === 0 && <p className="text-sm text-muted">No upcoming events.</p>}
                      {events.map((e) => (
                        <li key={e._id} className="flex items-center gap-4 rounded-xl border border-line p-3.5">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-center text-brand-600 dark:text-brand-300">
                            <span><span className="block text-sm font-bold leading-none">{new Date(e.date).getDate()}</span><span className="text-[10px] font-bold uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })}</span></span>
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{e.title}</p>
                            <p className="flex items-center gap-1 text-xs text-muted"><MapPin size={11} />{e.location}{e.time ? ` · ${e.time}` : ''}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ============ ATTENDANCE ============ */}
            {tab === 'attendance' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    ['Attendance %', `${overall.percentage}%`, 'text-brand-600 dark:text-brand-300'],
                    ['Present Days', overall.present, 'text-emerald-600'],
                    ['Absent Days', overall.absent, 'text-red-500'],
                    ['Late Days', overall.late, 'text-amber-500'],
                  ].map(([k, v, c]) => (
                    <div key={k} className="card p-5 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted">{k}</p>
                      <p className={cx('mt-1 font-display text-3xl font-bold', c)}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="card p-6">
                    <h3 className="mb-4 font-display text-lg font-semibold">Monthly Attendance</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={(attendance?.byMonth || []).map((m) => ({ month: new Date(`${m.month}-01`).toLocaleString('en', { month: 'short' }), Present: m.Present, Absent: m.Absent, Late: m.Late }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
                        <XAxis dataKey="month" tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Late" stackId="a" fill="#dbac33" />
                        <Bar dataKey="Absent" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card p-6">
                    <h3 className="mb-4 font-display text-lg font-semibold">Overall Split</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={3}>
                          <Cell fill="#10b981" /><Cell fill="#ef4444" /><Cell fill="#dbac33" />
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ============ RESULTS ============ */}
            {tab === 'results' && (
              <div className="space-y-6">
                {results.length === 0 && <div className="card p-10 text-center text-muted">No results published yet.</div>}
                {results.map((r) => (
                  <div key={r._id} className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-line/20 p-5">
                      <div>
                        <p className="font-display text-lg font-semibold">{r.exam}</p>
                        <p className="text-xs text-muted">Session {r.session}</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="badge bg-accent-100 text-accent-700">Grade {r.grade}</span>
                        <span className={cx('badge', r.status === 'Pass' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-50 text-red-600')}>{r.status}</span>
                        <span className={cx('badge bg-line/50 font-bold', gradeColor(r.percentage))}>{r.percentage}%</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <table className="table">
                        <thead><tr><th>Subject</th><th>Max</th><th>Obtained</th></tr></thead>
                        <tbody>
                          {r.subjects.map((s) => (
                            <tr key={s.name}><td className="font-semibold">{s.name}</td><td>{s.maxMarks}</td>
                              <td className={cx('font-bold', gradeColor((s.obtainedMarks / s.maxMarks) * 100))}>{s.obtainedMarks}</td></tr>
                          ))}
                          <tr className="font-bold"><td>Total</td><td>{r.totalMax}</td><td>{r.totalObtained}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ============ FEES ============ */}
            {tab === 'fees' && (
              <div className="space-y-6">
                {fees.length === 0 && <div className="card p-10 text-center text-muted">No fee records found.</div>}
                {fees.map((f) => (
                  <div key={f._id} className="card p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-semibold">{f.title} <span className="text-sm font-normal text-muted">({f.session})</span></p>
                        <p className="text-xs text-muted">Due date: {fmtDate(f.dueDate)}</p>
                      </div>
                      <span className={cx('badge px-4 py-1.5 text-sm', statusColor[f.status])}>{f.status}</span>
                    </div>
                    <div className="mt-5">
                      <div className="mb-1.5 flex justify-between text-sm font-semibold">
                        <span>Paid {inr(f.paidAmount)} of {inr(f.totalAmount)}</span>
                        <span className="text-red-500">Pending {inr(f.pendingAmount)}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-line/60">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${Math.min(100, (f.paidAmount / f.totalAmount) * 100)}%` }} />
                      </div>
                    </div>
                    {f.payments?.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Payment History</p>
                        <ul className="space-y-1.5 text-sm">
                          {f.payments.map((p) => (
                            <li key={p._id} className="flex justify-between rounded-lg bg-line/20 px-3.5 py-2">
                              <span>{fmtDate(p.date)} · {p.method} · <span className="text-xs text-muted">{p.receiptNo}</span></span>
                              <span className="font-bold text-emerald-600">{inr(p.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                <p className="rounded-xl bg-line/40 p-4 text-xs text-muted">{settings.feesNote} Online payment will be enabled soon — please pay at the school office for now.</p>
              </div>
            )}

            {/* ============ NOTICES & DOCUMENTS ============ */}
            {tab === 'notices' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold">School Notices</h3>
                  {notices.map((n) => <NoticeCard key={n._id} notice={n} />)}
                </div>
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><FolderOpen size={19} className="text-brand-600 dark:text-brand-300" /> Documents & Circulars</h3>
                  {documents.length === 0 && <div className="card p-8 text-center text-sm text-muted">No public documents shared yet.</div>}
                  {documents.map((d) => (
                    <a key={d._id} href={`${api.defaults.baseURL}/documents/${d._id}/download`} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-300"><FileDown size={17} /></span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{d.title}</p>
                        <p className="text-xs text-muted">{d.category} · {fmtDate(d.createdAt)}</p>
                      </div>
                      <ChevronRight size={16} className="ml-auto text-muted" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        {settings.site.schoolName} · Parent Portal · {settings.site.address}
      </footer>
    </div>
  );
}

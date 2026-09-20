import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, GraduationCap, Clock3, CalendarCheck, Wallet, MessageSquare, Inbox,
  TrendingUp, ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/StateViews.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { inr, fmtDate, cx, statusColor } from '../../utils/format.js';

const COLORS = ['#2754e3', '#dbac33', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#64748b'];
const tooltipStyle = { borderRadius: 12, border: '1px solid rgb(var(--line))', background: 'rgb(var(--surface))', color: 'rgb(var(--ink))', fontSize: 13 };

export default function Dashboard() {
  const { data, loading, error, refetch } = useFetch('/dashboard/overview');
  if (loading) return <FullPageLoader label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { stats, admissionTrend, attendanceTrend, classDistribution, feeCollection, recentAdmissions, latestMessages } = data;

  const cards = [
    { icon: Users, label: 'Total Students', value: stats.students, tone: 'from-brand-600 to-brand-800', to: '/admin/students' },
    { icon: UserCheck, label: 'Teachers', value: stats.teachers, tone: 'from-violet-500 to-violet-700', to: '/admin/teachers' },
    { icon: GraduationCap, label: 'New Admissions (30d)', value: stats.newApps, tone: 'from-emerald-500 to-emerald-700', to: '/admin/admissions' },
    { icon: Clock3, label: 'Pending Applications', value: stats.pendingApps, tone: 'from-amber-400 to-amber-600', to: '/admin/admissions' },
    { icon: CalendarCheck, label: "Today's Attendance", value: `${stats.attendanceToday.present}/${stats.attendanceToday.marked || '—'}`, tone: 'from-sky-500 to-sky-700', to: '/admin/attendance' },
    { icon: Wallet, label: 'Pending Fees', value: inr(stats.pendingFees), tone: 'from-rose-500 to-rose-700', to: '/admin/fees' },
    { icon: MessageSquare, label: 'Unread Messages', value: stats.unreadMessages, tone: 'from-cyan-500 to-cyan-700', to: '/admin/messages' },
    { icon: Inbox, label: 'New Enquiries', value: stats.newEnquiries, tone: 'from-indigo-500 to-indigo-700', to: '/admin/enquiries' },
  ];

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle={`Welcome back — here's what's happening at school today.`}>
        <Link to="/admin/admissions" className="btn-primary btn-sm"><TrendingUp size={14} /> Review Applications</Link>
      </AdminHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, tone, to }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={to} className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-1 hover:shadow-lift">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow`}><Icon size={21} /></span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
                <p className="truncate font-display text-xl font-bold sm:text-2xl">{value}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold">Admission Applications — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={admissionTrend}>
              <defs><linearGradient id="admG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2754e3" stopOpacity={0.4} /><stop offset="100%" stopColor="#2754e3" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
              <XAxis dataKey="month" tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="applications" stroke="#2754e3" strokeWidth={2.5} fill="url(#admG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold">Attendance Trend (% Present)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
              <XAxis dataKey="day" tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="percentage" fill="#dbac33" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold">Student Distribution by Class</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={classDistribution} dataKey="students" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>
                {classDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold">Fee Collection</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={feeCollection} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>
                <Cell fill="#10b981" /><Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => inr(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent Applications</h3>
            <Link to="/admin/admissions" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-300">All <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {recentAdmissions.length === 0 && <p className="text-sm text-muted">No applications yet.</p>}
            {recentAdmissions.map((a) => (
              <div key={a._id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3.5">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.studentName} <span className="text-xs font-medium text-muted">· {a.applicationId}</span></p>
                  <p className="text-xs text-muted">{a.classApplyingFor} · {fmtDate(a.createdAt)}</p>
                </div>
                <span className={cx('badge shrink-0', statusColor[a.status])}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Latest Messages</h3>
            <Link to="/admin/messages" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-300">All <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {latestMessages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
            {latestMessages.map((m) => (
              <div key={m._id} className="flex items-start justify-between gap-3 rounded-xl border border-line p-3.5">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{m.name} <span className="text-xs font-medium text-muted">· {m.subject}</span></p>
                  <p className="line-clamp-1 text-xs text-muted">{m.message}</p>
                </div>
                {!m.isRead && <span className="badge shrink-0 bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">New</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

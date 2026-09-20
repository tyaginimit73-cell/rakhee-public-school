import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CalendarCheck, Save, CheckCircle2 } from 'lucide-react';
import { Field, Input, Select } from '../common/Field.jsx';
import { ButtonSpinner } from '../common/Loader.jsx';
import { EmptyState } from '../common/StateViews.jsx';
import api from '../../services/api.js';
import { cx } from '../../utils/format.js';

const STATUS_STYLES = {
  Present: 'bg-emerald-500 text-white border-emerald-500',
  Absent: 'bg-red-500 text-white border-red-500',
  Late: 'bg-amber-400 text-navy-950 border-amber-400',
};

// Same roster+marking logic and markup as the original admin-only
// Attendance page, extracted so it can be reused from the teacher
// portal too — the only real difference between "admin marks attendance"
// and "teacher marks attendance for their own classes" is which classes
// populate the dropdown, and the backend independently enforces that
// distinction regardless of what this component is given to show (see
// controllers/attendanceController.js), so this doesn't need to know or
// care which caller it is.
export default function AttendanceMarker({ classes, emptyClassesMessage }) {
  const [classId, setClassId] = useState(classes[0]?._id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!classId && classes[0]) setClassId(classes[0]._id);
  }, [classes, classId]);

  const load = useCallback(async () => {
    if (!classId || !date) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/roster?classId=${classId}&date=${date}`);
      setRoster(data.data.roster);
      setSaved(data.data.saved);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, [classId, date]);
  useEffect(() => { load(); }, [load]);

  const setStatus = (studentId, status) =>
    setRoster((r) => r.map((s) => (s.studentId === studentId ? { ...s, status } : s)));

  const markAll = (status) => setRoster((r) => r.map((s) => ({ ...s, status })));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/attendance/mark', {
        classId, date, records: roster.map((s) => ({ studentId: s.studentId, status: s.status })),
      });
      toast.success(data.message);
      setSaved(true);
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const counts = roster.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {});

  if (!classes.length) {
    return <EmptyState icon={CalendarCheck} title="No classes to show" message={emptyClassesMessage || 'No classes are available.'} />;
  }

  return (
    <div>
      {roster.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button type="button" className="btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <ButtonSpinner /> : <Save size={15} />} Save Attendance
          </button>
        </div>
      )}

      <div className="card mb-5 flex flex-wrap items-end gap-4 p-5">
        <Field label="Class" className="w-48">
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.section})</option>)}
          </Select>
        </Field>
        <Field label="Date" className="w-48">
          <Input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {roster.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-1 text-sm">
            <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Present: {counts.Present || 0}</span>
            <span className="badge bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">Absent: {counts.Absent || 0}</span>
            <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Late: {counts.Late || 0}</span>
            {saved && <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200"><CheckCircle2 size={12} /> Saved</span>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : roster.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No students in this class" message="Add students to the class to mark attendance." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Roll No</th><th>Student</th>
                <th>
                  <div className="flex items-center gap-2">
                    Status
                    <button type="button" className="text-[10px] font-bold lowercase tracking-normal text-brand-600 hover:underline dark:text-brand-300" onClick={() => markAll('Present')}>all present</button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.studentId}>
                  <td className="font-bold">{s.rollNumber}</td>
                  <td>{s.name}</td>
                  <td>
                    <div className="flex gap-2" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
                      {['Present', 'Absent', 'Late'].map((st) => (
                        <button key={st} type="button" onClick={() => setStatus(s.studentId, st)}
                          className={cx('rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                            s.status === st ? STATUS_STYLES[st] : 'border-line text-muted hover:border-brand-400 hover:text-ink')}>
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

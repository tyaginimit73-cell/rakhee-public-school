import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileText, X } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { useDebounce } from '../../hooks/useDebounce.js';

const BLANK_SUBJECT = { name: '', maxMarks: 100, obtainedMarks: '' };

export default function Results() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ rollNumber: '', exam: 'Annual Examination', session: '2026-27' });
  const [subjects, setSubjects] = useState([{ ...BLANK_SUBJECT }]);
  const debounced = useDebounce(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/results?page=${page}&limit=10&search=${encodeURIComponent(debounced)}`);
      setData(res.data);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, [page, debounced]);
  useEffect(() => { load(); }, [load]);

  const setSubject = (i, k, v) => setSubjects((arr) => arr.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  const submit = async (e) => {
    e.preventDefault();
    const clean = subjects.filter((s) => s.name && s.obtainedMarks !== '');
    if (!clean.length) return toast.error('Add at least one subject with marks');
    setSaving(true);
    try {
      const { data: res } = await api.post('/results', {
        ...form,
        subjects: clean.map((s) => ({ name: s.name, maxMarks: Number(s.maxMarks) || 100, obtainedMarks: Number(s.obtainedMarks) })),
      });
      toast.success(res.message);
      setModal(false);
      setForm({ rollNumber: '', exam: 'Annual Examination', session: '2026-27' });
      setSubjects([{ ...BLANK_SUBJECT }]);
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/results/${deleting._id}`); toast.success('Result deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div>
      <AdminHeader title="Results" subtitle="Publish & manage examination results">
        <button type="button" className="btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={15} /> Publish Result</button>
      </AdminHeader>

      <DataTable
        loading={loading}
        columns={[
          { key: 'student', label: 'Student', render: (r) => (
            <div><p className="font-bold">{r.student ? `${r.student.firstName} ${r.student.lastName}` : '—'}</p>
            <p className="text-xs text-muted">{r.student?.rollNumber} · {r.student?.class?.name || ''}</p></div>
          ) },
          { key: 'exam', label: 'Exam', render: (r) => `${r.exam} · ${r.session}` },
          { key: 'totalObtained', label: 'Score', render: (r) => <span className="font-bold">{r.totalObtained}/{r.totalMax}</span> },
          { key: 'percentage', label: '%', render: (r) => `${r.percentage}%` },
          { key: 'grade', label: 'Grade', render: (r) => <span className="badge bg-accent-100 text-accent-700">{r.grade}</span> },
          { key: 'status', label: 'Status', render: (r) => <span className={`badge ${r.status === 'Pass' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-50 text-red-600'}`}>{r.status}</span> },
          { key: 'published', label: 'Visible', render: (r) => (r.published ? '✅' : '🚫') },
          { key: 'actions', label: '', render: (r) => (
            <div className="flex justify-end"><button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(r)} aria-label="Delete"><Trash2 size={15} /></button></div>
          ) },
        ]}
        rows={data.items}
        search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        page={data.page} pages={data.pages} onPage={setPage}
        empty={{ title: 'No results published', message: 'Results you publish become visible on the public Results page and the parent portal.' }}
      />

      <Modal open={modal} onClose={() => setModal(false)} title="Publish Result" size="max-w-2xl">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Roll Number" required><Input placeholder="RPS1001" value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value.toUpperCase() }))} required /></Field>
            <Field label="Exam" required><Input value={form.exam} onChange={(e) => setForm((f) => ({ ...f, exam: e.target.value }))} required /></Field>
            <Field label="Session" required><Input value={form.session} onChange={(e) => setForm((f) => ({ ...f, session: e.target.value }))} required /></Field>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">Subjects & Marks</p>
              <button type="button" className="btn-outline btn-sm" onClick={() => setSubjects((a) => [...a, { ...BLANK_SUBJECT }])}><Plus size={13} /> Add Subject</button>
            </div>
            <div className="space-y-2">
              {subjects.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input className="flex-1" placeholder="Subject name" value={s.name} onChange={(e) => setSubject(i, 'name', e.target.value)} />
                  <Input className="w-24" type="number" min="1" placeholder="Max" value={s.maxMarks} onChange={(e) => setSubject(i, 'maxMarks', e.target.value)} />
                  <Input className="w-24" type="number" min="0" placeholder="Marks" value={s.obtainedMarks} onChange={(e) => setSubject(i, 'obtainedMarks', e.target.value)} />
                  {subjects.length > 1 && <button type="button" className="btn-icon shrink-0" onClick={() => setSubjects((a) => a.filter((_, j) => j !== i))} aria-label="Remove subject"><X size={14} /></button>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? <ButtonSpinner /> : <FileText size={15} />} Publish Result</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete result?" message={`Delete the ${deleting?.exam} result of ${deleting?.student?.firstName} ${deleting?.student?.lastName}?`} />
    </div>
  );
}

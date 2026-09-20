import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select, Textarea, FileInput } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/StateViews.jsx';
import api from '../../services/api.js';
import { initials } from '../../utils/format.js';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

const BLANK = { name: '', designation: 'Teacher', qualification: '', department: '', subjects: '', experienceYears: 0, email: '', phone: '', bio: '' };

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [photo, setPhoto] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/teachers?all=true'); setTeachers(data.data.items); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(BLANK); setPhoto(null); setModal({ mode: 'create' }); };
  const openEdit = (t) => { setForm({ ...BLANK, ...t, subjects: (t.subjects || []).join(', ') }); setPhoto(null); setModal({ mode: 'edit', teacher: t }); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean), experienceYears: Number(form.experienceYears) || 0 };
    try {
      if (modal.mode === 'create') { await api.post('/teachers', payload); toast.success('Teacher added'); }
      else { await api.put(`/teachers/${modal.teacher._id}`, payload); toast.success('Teacher updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/teachers/${deleting._id}`); toast.success('Teacher deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <AdminHeader title="Teachers" subtitle={`${teachers.length} faculty members`}>
        <button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Add Teacher</button>
      </AdminHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40" />)}</div>
      ) : teachers.length === 0 ? (
        <EmptyState icon={Users} title="No teachers yet" message="Add faculty members to show them on the public Faculty page."
          action={<button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Teacher</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t, i) => (
            <motion.div key={t._id} className="card flex gap-4 p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 font-display text-lg font-bold text-white">{initials(t.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{t.name}</p>
                <p className="text-xs font-semibold text-accent-600">{t.designation} · {t.department}</p>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted">{t.qualification} · {t.experienceYears}+ yrs{(t.subjects || []).length ? ` · ${t.subjects.join(', ')}` : ''}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" className="btn-icon" onClick={() => openEdit(t)} aria-label="Edit"><Pencil size={14} /></button>
                <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(t)} aria-label="Delete"><Trash2 size={14} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Teacher' : 'Edit Teacher'} size="max-w-2xl">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Full Name" required><Input value={form.name} onChange={set('name')} required /></Field>
          <Field label="Designation" required><Input value={form.designation} onChange={set('designation')} required /></Field>
          <Field label="Qualification" required><Input placeholder="e.g. M.Sc., B.Ed." value={form.qualification} onChange={set('qualification')} required /></Field>
          <Field label="Department" required><Input placeholder="e.g. Mathematics" value={form.department} onChange={set('department')} required list="departments" /></Field>
          <datalist id="departments">{[...new Set(teachers.map((t) => t.department))].map((d) => <option key={d} value={d} />)}</datalist>
          <Field label="Subjects (comma separated)"><Input placeholder="Maths, Science" value={form.subjects} onChange={set('subjects')} /></Field>
          <Field label="Experience (years)"><Input type="number" min="0" value={form.experienceYears} onChange={set('experienceYears')} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Short Bio" className="sm:col-span-2"><Textarea rows={2} value={form.bio} onChange={set('bio')} /></Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Save Teacher</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete teacher?" message={`Remove ${deleting?.name} from the faculty list?`} />
    </div>
  );
}

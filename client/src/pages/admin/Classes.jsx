import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/StateViews.jsx';
import api from '../../services/api.js';
import { School } from 'lucide-react';

const BLANK = { name: '', section: 'A', level: 'Primary', subjects: '', classTeacher: '', capacity: 40 };

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([api.get('/classes'), api.get('/teachers?all=true')]);
      setClasses(c.data.data.items);
      setTeachers(t.data.data.items);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(BLANK); setModal({ mode: 'create' }); };
  const openEdit = (c) => { setForm({ ...BLANK, ...c, subjects: (c.subjects || []).join(', '), classTeacher: c.classTeacher?._id || '', capacity: c.capacity || 40 }); setModal({ mode: 'edit', cls: c }); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean), classTeacher: form.classTeacher || null, capacity: Number(form.capacity) || 40 };
    try {
      if (modal.mode === 'create') { await api.post('/classes', payload); toast.success('Class created'); }
      else { await api.put(`/classes/${modal.cls._id}`, payload); toast.success('Class updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/classes/${deleting._id}`); toast.success('Class deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <AdminHeader title="Classes" subtitle={`${classes.length} classes & sections`}>
        <button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Add Class</button>
      </AdminHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-36" />)}</div>
      ) : classes.length === 0 ? (
        <EmptyState icon={School} title="No classes yet" message="Create classes to enroll students and manage academics."
          action={<button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Class</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c, i) => (
            <motion.div key={c._id} className="card p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-xl font-semibold">{c.name} <span className="text-muted">({c.section})</span></p>
                  <span className="badge mt-1 bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">{c.level}</span>
                </div>
                <div className="flex gap-1">
                  <button type="button" className="btn-icon" onClick={() => openEdit(c)} aria-label="Edit"><Pencil size={14} /></button>
                  <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(c)} aria-label="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="mt-3 line-clamp-1 text-xs text-muted">{(c.subjects || []).join(', ')}</p>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted"><Users size={14} /> {c.studentCount}/{c.capacity} students</span>
                <span className="text-xs font-semibold text-muted">{c.classTeacher?.name || 'No class teacher'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Class' : 'Edit Class'}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Class Name" required><Input placeholder="e.g. Class 6" value={form.name} onChange={set('name')} required /></Field>
          <Field label="Section" required><Input value={form.section} onChange={set('section')} required /></Field>
          <Field label="Level">
            <Select value={form.level} onChange={set('level')}>
              {['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'].map((l) => <option key={l}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Class Teacher">
            <Select value={form.classTeacher} onChange={set('classTeacher')}>
              <option value="">None</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Subjects (comma separated)" className="sm:col-span-2"><Input placeholder="English, Hindi, Mathematics…" value={form.subjects} onChange={set('subjects')} /></Field>
          <Field label="Capacity"><Input type="number" min="1" value={form.capacity} onChange={set('capacity')} /></Field>
          <div className="flex items-end justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Save Class</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete class?" message={`Delete ${deleting?.name} (${deleting?.section})? Classes with enrolled students cannot be deleted.`} />
    </div>
  );
}

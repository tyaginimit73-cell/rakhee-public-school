import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Images } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select, FileInput } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/StateViews.jsx';
import api from '../../services/api.js';

const BLANK = { title: '', caption: '', category: 'Campus' };
const DEFAULT_CATEGORIES = ['Campus', 'Classrooms', 'Sports', 'Events', 'Celebrations', 'Activities', 'Achievements'];

export default function Gallery() {
  const [data, setData] = useState({ items: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get('/gallery'); setData(res.data); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...(data.categories || [])])];

  const openCreate = () => { setForm(BLANK); setFile(null); setModal({ mode: 'create' }); };
  const openEdit = (g) => { setForm({ title: g.title, caption: g.caption || '', category: g.category }); setFile(null); setModal({ mode: 'edit', image: g }); };

  const submit = async (e) => {
    e.preventDefault();
    if (modal.mode === 'create' && !file) return toast.error('Please choose an image file');
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('image', file);
    try {
      if (modal.mode === 'create') { await api.post('/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Image added'); }
      else { await api.put(`/gallery/${modal.image._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Image updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/gallery/${deleting._id}`); toast.success('Image deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <AdminHeader title="Gallery" subtitle={`${data.items.length} photos published`}>
        <button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Upload Image</button>
      </AdminHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-44" />)}</div>
      ) : data.items.length === 0 ? (
        <EmptyState icon={Images} title="No photos yet" action={<button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Upload Image</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.items.map((g, i) => (
            <motion.figure key={g._id} className="group relative overflow-hidden rounded-2xl border border-line"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <img src={g.imagePath} alt={g.title} loading="lazy" className="h-44 w-full object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/85 to-transparent p-3">
                <p className="truncate text-sm font-bold text-white">{g.title}</p>
                <p className="text-xs text-white/70">{g.category}</p>
              </figcaption>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" className="btn-icon bg-white/90 hover:bg-white" onClick={() => openEdit(g)} aria-label="Edit"><Pencil size={14} /></button>
                <button type="button" className="btn-icon bg-white/90 text-red-500 hover:bg-white" onClick={() => setDeleting(g)} aria-label="Delete"><Trash2 size={14} /></button>
              </div>
            </motion.figure>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Upload Image' : 'Edit Image'}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Title" required><Input value={form.title} onChange={set('title')} required /></Field>
          <Field label="Caption"><Input value={form.caption} onChange={set('caption')} /></Field>
          <Field label="Category">
            <Select value={form.category} onChange={set('category')}>{categories.map((c) => <option key={c}>{c}</option>)}</Select>
            <p className="mt-1 text-xs text-muted">Type a new category below to create one.</p>
            <Input className="mt-2" placeholder="Or type a new category…" value={form.category} onChange={set('category')} />
          </Field>
          <Field label={modal?.mode === 'create' ? 'Image File' : 'Replace Image (optional)'}>
            <FileInput file={file} label="Choose image (JPG/PNG/WebP, max 5 MB)" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Save</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete image?" message={`Remove “${deleting?.title}” from the gallery?`} />
    </div>
  );
}

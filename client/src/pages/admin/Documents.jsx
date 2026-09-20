import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileDown, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select, FileInput } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/StateViews.jsx';
import api from '../../services/api.js';
import { fmtDate } from '../../utils/format.js';

const BLANK = { title: '', category: 'General', visibility: 'admin' };

export default function Documents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/documents'); setItems(data.data.items); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please choose a file');
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    try {
      const { data: res } = await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.message); setModal(false); setForm(BLANK); setFile(null); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/documents/${deleting._id}`); toast.success('Document deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div>
      <AdminHeader title="Documents" subtitle="Circulars, forms and official files. 'Public' documents are visible in the parent portal.">
        <button type="button" className="btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={15} /> Upload Document</button>
      </AdminHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents" action={<button type="button" className="btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={14} /> Upload</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d, i) => (
            <motion.div key={d._id} className="card flex items-center gap-4 p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-300"><FolderOpen size={19} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{d.title}</p>
                <p className="text-xs text-muted">{d.category} · {fmtDate(d.createdAt)} · {(d.size / 1024).toFixed(0)} KB
                  <span className={`badge ml-2 ${d.visibility === 'public' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-line/60 text-muted'}`}>{d.visibility}</span>
                </p>
              </div>
              <div className="flex gap-1">
                <a href={`${api.defaults.baseURL}/documents/${d._id}/download`} target="_blank" rel="noreferrer" className="btn-icon" title="Download" aria-label={`Download ${d.title || 'document'}`}><FileDown size={15} /></a>
                <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(d)} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Upload Document">
        <form onSubmit={upload} className="space-y-4" noValidate>
          <Field label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>{['Notice', 'Circular', 'Admission', 'Result', 'General'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Visibility"><Select value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}><option value="admin">Admin only</option><option value="public">Public (portal)</option></Select></Field>
          </div>
          <Field label="File" required><FileInput file={file} label="PDF, image or document (max 5 MB)" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Upload</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete document?" message={`Delete “${deleting?.title}” and its file?`} />
    </div>
  );
}

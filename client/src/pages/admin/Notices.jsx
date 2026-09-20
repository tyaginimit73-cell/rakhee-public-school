import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Download, Pin } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select, Textarea, FileInput } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { fmtDate, NOTICE_CATEGORIES } from '../../utils/format.js';

const BLANK = { title: '', description: '', category: 'General', isImportant: false, isPublished: true };

export default function Notices() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [file, setFile] = useState(null);
  const debounced = useDebounce(search);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get(`/notices?all=true&page=${page}&limit=10`); setData(res.data); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, [page]);
  useEffect(() => { load(); }, [load]);

  const filtered = data.items.filter((n) => !debounced || n.title.toLowerCase().includes(debounced.toLowerCase()));

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('attachment', file);
    return fd;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = buildFormData();
      if (modal.mode === 'create') { await api.post('/notices', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Notice published'); }
      else { await api.put(`/notices/${modal.notice._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Notice updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/notices/${deleting._id}`); toast.success('Notice deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <AdminHeader title="Notice Board" subtitle={`${data.total} notices published`}>
        <button type="button" className="btn-primary btn-sm" onClick={() => { setForm(BLANK); setFile(null); setModal({ mode: 'create' }); }}><Plus size={15} /> New Notice</button>
      </AdminHeader>

      <DataTable
        loading={loading}
        columns={[
          { key: 'title', label: 'Title', render: (n) => (
            <span className="flex items-center gap-2 font-semibold">{n.isImportant && <Pin size={13} className="text-accent-500" />}{n.title}</span>
          ) },
          { key: 'category', label: 'Category', render: (n) => <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">{n.category}</span> },
          { key: 'publishDate', label: 'Published', render: (n) => fmtDate(n.publishDate) },
          { key: 'isPublished', label: 'Visible', render: (n) => (n.isPublished ? '✅' : '🚫') },
          { key: 'attachment', label: 'File', render: (n) => n.attachmentPath ? <a href={n.attachmentPath} target="_blank" rel="noreferrer" className="btn-icon" title={n.attachmentName} aria-label={`Download ${n.attachmentName || 'attachment'}`}><Download size={15} /></a> : '—' },
          { key: 'actions', label: '', render: (n) => (
            <div className="flex justify-end gap-1">
              <button type="button" className="btn-icon" onClick={() => { setForm({ title: n.title, description: n.description, category: n.category, isImportant: n.isImportant, isPublished: n.isPublished }); setFile(null); setModal({ mode: 'edit', notice: n }); }} aria-label="Edit"><Pencil size={15} /></button>
              <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(n)} aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          ) },
        ]}
        rows={filtered}
        search={search} onSearch={setSearch}
        page={data.page} pages={data.pages} onPage={setPage}
        empty={{ title: 'No notices', message: 'Publish your first notice for the school website.' }}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Publish Notice' : 'Edit Notice'}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Title" required><Input value={form.title} onChange={set('title')} required /></Field>
          <Field label="Description" required><Textarea rows={4} value={form.description} onChange={set('description')} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><Select value={form.category} onChange={set('category')}>{NOTICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Attachment (PDF/image, optional)"><FileInput file={file} label={modal?.notice?.attachmentName || 'Attach file'} accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" checked={form.isImportant} onChange={(e) => setForm((f) => ({ ...f, isImportant: e.target.checked }))} /> Mark Important</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} /> Visible on Website</label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Save Notice</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete notice?" message={`Delete “${deleting?.title}”?`} />
    </div>
  );
}

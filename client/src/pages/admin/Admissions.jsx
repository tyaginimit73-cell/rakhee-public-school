import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Eye, Trash2, FileDown, Save } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Select, Textarea } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { fmtDate, fmtDateTime, cx, statusColor, ADMISSION_STATUSES } from '../../utils/format.js';

export default function Admissions() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('Under Review');
  const [statusNote, setStatusNote] = useState('');
  const [notes, setNotes] = useState('');
  const debounced = useDebounce(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/admissions?page=${page}&limit=10&search=${encodeURIComponent(debounced)}${status ? `&status=${encodeURIComponent(status)}` : ''}`);
      setData(res.data);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, [page, debounced, status]);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const { data: res } = await api.get(`/admissions/${id}`);
      setDetail(res.data);
      setNewStatus(res.data.status);
      setNotes(res.data.notes || '');
      setStatusNote('');
    } catch (err) { toast.error(err.message); }
  };

  const applyStatus = async () => {
    setSaving(true);
    try {
      const { data: res } = await api.patch(`/admissions/${detail._id}/status`, { status: newStatus, note: statusNote });
      toast.success(res.message);
      setDetail(res.data);
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const saveNotes = async () => {
    setSaving(true);
    try { const { data: res } = await api.patch(`/admissions/${detail._id}/notes`, { notes }); toast.success(res.message); setDetail(res.data); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/admissions/${deleting._id}`); toast.success('Application deleted'); setDeleting(null); setDetail(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const pending = data.items.filter((a) => a.status === 'Submitted').length;

  return (
    <div>
      <AdminHeader title="Admission Applications" subtitle={`${data.total} total applications`} />

      <DataTable
        loading={loading}
        columns={[
          { key: 'applicationId', label: 'App ID', render: (a) => <span className="font-bold">{a.applicationId}</span> },
          { key: 'studentName', label: 'Student' },
          { key: 'classApplyingFor', label: 'Class' },
          { key: 'fatherName', label: 'Father' },
          { key: 'phone', label: 'Phone' },
          { key: 'createdAt', label: 'Applied', render: (a) => fmtDate(a.createdAt) },
          { key: 'status', label: 'Status', render: (a) => <span className={cx('badge', statusColor[a.status])}>{a.status}</span> },
          { key: 'actions', label: '', render: (a) => (
            <div className="flex justify-end gap-1">
              <button type="button" className="btn-icon" onClick={() => openDetail(a._id)} aria-label="View"><Eye size={15} /></button>
              <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(a)} aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          ) },
        ]}
        rows={data.items}
        search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        page={data.page} pages={data.pages} onPage={setPage}
        toolbar={(
          <Select className="w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {ADMISSION_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        )}
        empty={{ title: 'No applications yet', message: 'Online applications from the website will appear here.' }}
      />

      {/* Detail drawer */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Application ${detail.applicationId}` : ''} size="max-w-2xl">
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-line/20 p-4">
              <div>
                <p className="font-display text-xl font-semibold">{detail.studentName}</p>
                <p className="text-sm text-muted">{detail.classApplyingFor} · {detail.gender} · DOB {fmtDate(detail.dob)}</p>
              </div>
              <span className={cx('badge px-4 py-1.5 text-sm', statusColor[detail.status])}>{detail.status}</span>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {[['Father', detail.fatherName], ['Mother', detail.motherName], ['Guardian', detail.guardianName || '—'], ['Phone', detail.phone],
                ['Email', detail.email || '—'], ['Address', detail.address ? `${detail.address.line1}, ${detail.address.city}, ${detail.address.district}, ${detail.address.state} — ${detail.address.pincode}` : '—'],
                ['Previous School', detail.previousSchool || '—'], ['Previous Class', detail.previousClass || '—'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-line p-3"><p className="text-xs font-bold uppercase text-muted">{k}</p><p className="mt-0.5 font-medium">{v}</p></div>
              ))}
            </div>

            {detail.documents?.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-bold">Attached Documents</p>
                <div className="flex flex-wrap gap-2">
                  {detail.documents.map((d, i) => (
                    <a key={i} href={`${api.defaults.baseURL}/admissions/${detail.applicationId}/documents/${d.filename}/download`} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><FileDown size={14} /> {d.originalName || d.label}</a>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-line p-4">
              <p className="mb-3 text-sm font-bold">Update Status</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="New Status"><Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>{ADMISSION_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                <Field label="Note (optional)"><Textarea rows={1} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Reason or remark…" /></Field>
              </div>
              <button type="button" className="btn-primary btn-sm mt-3" onClick={applyStatus} disabled={saving || newStatus === detail.status}>
                {saving && <ButtonSpinner />} Apply Status
              </button>
            </div>

            <div className="rounded-2xl border border-line p-4">
              <p className="mb-2 text-sm font-bold">Internal Notes</p>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Office-only notes about this application…" />
              <button type="button" className="btn-outline btn-sm mt-2" onClick={saveNotes} disabled={saving}><Save size={14} /> Save Notes</button>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">Timeline</p>
              <ol className="space-y-2 text-sm">
                {(detail.statusHistory || []).slice().reverse().map((h, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl bg-line/20 px-4 py-2.5">
                    <span className="font-semibold">{h.status}{h.note ? <span className="font-normal text-muted"> — {h.note}</span> : ''}</span>
                    <span className="text-xs text-muted">{fmtDateTime(h.at)} · {h.by}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete application?" message={`Permanently delete the application of ${deleting?.studentName} (${deleting?.applicationId})?`} />
    </div>
  );
}

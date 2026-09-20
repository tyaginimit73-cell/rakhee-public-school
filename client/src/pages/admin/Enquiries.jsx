import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Phone } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { Select } from '../../components/common/Field.jsx';
import api from '../../services/api.js';
import { fmtDateTime, cx, statusColor } from '../../utils/format.js';

export default function Enquiries() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get(`/enquiries?page=${page}&limit=10${status ? `&status=${status}` : ''}`); setData(res.data); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, [page, status]);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (enquiry, newStatus) => {
    try { await api.patch(`/enquiries/${enquiry._id}`, { status: newStatus }); toast.success(`Marked as ${newStatus}`); load(); }
    catch (err) { toast.error(err.message); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/enquiries/${deleting._id}`); toast.success('Enquiry deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div>
      <AdminHeader title="Admission Enquiries" subtitle="Callback requests submitted from the website" />
      <DataTable
        loading={loading}
        columns={[
          { key: 'name', label: 'Name', render: (e) => <span className="font-semibold">{e.name}</span> },
          { key: 'phone', label: 'Phone', render: (e) => <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-300"><Phone size={13} />{e.phone}</a> },
          { key: 'classInterested', label: 'Class', render: (e) => e.classInterested || '—' },
          { key: 'message', label: 'Message', render: (e) => <span className="line-clamp-1 max-w-[200px] text-muted">{e.message || '—'}</span> },
          { key: 'createdAt', label: 'Received', render: (e) => fmtDateTime(e.createdAt) },
          { key: 'status', label: 'Status', render: (e) => (
            <Select className="w-32 py-1.5 text-xs" value={e.status} onChange={(ev) => updateStatus(e, ev.target.value)}>
              {['New', 'Contacted', 'Closed'].map((s) => <option key={s}>{s}</option>)}
            </Select>
          ) },
          { key: 'actions', label: '', render: (e) => (
            <div className="flex justify-end"><button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(e)} aria-label="Delete"><Trash2 size={15} /></button></div>
          ) },
        ]}
        rows={data.items}
        page={data.page} pages={data.pages} onPage={setPage}
        toolbar={(
          <Select className="w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option><option>New</option><option>Contacted</option><option>Closed</option>
          </Select>
        )}
        empty={{ title: 'No enquiries', message: 'Enquiries from the website enquiry form will appear here.' }}
      />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete enquiry?" message={`Delete the enquiry from ${deleting?.name}?`} />
    </div>
  );
}

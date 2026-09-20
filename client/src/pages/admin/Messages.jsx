import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Trash2, MailOpen, Mail, Phone, AtSign } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { Select } from '../../components/common/Field.jsx';
import api from '../../services/api.js';
import { fmtDateTime, cx } from '../../utils/format.js';

export default function Messages() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [unreadOnly, setUnreadOnly] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get(`/contact?page=${page}&limit=10${unreadOnly ? '&unread=true' : ''}`); setData(res.data); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, [page, unreadOnly]);
  useEffect(() => { load(); }, [load]);

  const toggleRead = async (m) => {
    try { await api.patch(`/contact/${m._id}/read`); load(); } catch (err) { toast.error(err.message); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/contact/${deleting._id}`); toast.success('Message deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div>
      <AdminHeader title="Contact Messages" subtitle="Messages submitted through the Contact page" />
      <DataTable
        loading={loading}
        columns={[
          { key: 'name', label: 'From', render: (m) => (
            <div>
              <p className={cx('font-semibold', !m.isRead && 'text-brand-600 dark:text-brand-300')}>{!m.isRead && '● '}{m.name}</p>
              <p className="text-xs text-muted">{m.email}</p>
            </div>
          ) },
          { key: 'subject', label: 'Subject', render: (m) => <span className="font-semibold">{m.subject}</span> },
          { key: 'message', label: 'Message', render: (m) => (
            <button type="button" className="max-w-[280px] text-left text-muted hover:text-ink" onClick={() => setExpanded(expanded === m._id ? null : m._id)}>
              <span className={cx('text-sm', expanded === m._id ? '' : 'line-clamp-1')}>{m.message}</span>
            </button>
          ) },
          { key: 'phone', label: 'Phone', render: (m) => <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-300"><Phone size={12} />{m.phone}</a> },
          { key: 'createdAt', label: 'Received', render: (m) => fmtDateTime(m.createdAt) },
          { key: 'actions', label: '', render: (m) => (
            <div className="flex justify-end gap-1">
              <a className="btn-icon" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} title="Reply by email" aria-label="Reply by email"><AtSign size={15} /></a>
              <button type="button" className="btn-icon" title={m.isRead ? 'Mark unread' : 'Mark read'} aria-label={m.isRead ? 'Mark unread' : 'Mark read'} onClick={() => toggleRead(m)}>{m.isRead ? <Mail size={15} /> : <MailOpen size={15} />}</button>
              <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(m)} aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          ) },
        ]}
        rows={data.items}
        page={data.page} pages={data.pages} onPage={setPage}
        toolbar={(
          <Select className="w-44" value={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.value); setPage(1); }}>
            <option value="">All Messages</option><option value="true">Unread Only</option>
          </Select>
        )}
        empty={{ title: 'No messages', message: 'Contact form submissions from the website will appear here.' }}
      />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete message?" message={`Delete the message from ${deleting?.name}?`} />
    </div>
  );
}

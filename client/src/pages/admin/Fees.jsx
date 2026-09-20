import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, IndianRupee, Printer, History } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select, Textarea } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { inr, fmtDate, cx, statusColor } from '../../utils/format.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const BLANK = { rollNumber: '', title: 'Annual Fee', session: '2026-27', totalAmount: '', dueDate: '', note: '' };

export default function Fees() {
  const { settings } = useSettings();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [payForm, setPayForm] = useState({ amount: '', method: 'Cash', note: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/fees?page=${page}&limit=10${status ? `&status=${status}` : ''}`);
      setData(res.data);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, [page, status]);
  useEffect(() => { load(); }, [load]);

  const createFee = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: res } = await api.post('/fees', form);
      toast.success(res.message);
      setModal(false); setForm(BLANK); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const addPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: res } = await api.post(`/fees/${payTarget._id}/payments`, payForm);
      toast.success(res.message);
      setReceipt({ fee: res.data.fee, payment: res.data.receipt });
      setPayTarget(null);
      setPayForm({ amount: '', method: 'Cash', note: '' });
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/fees/${deleting._id}`); toast.success('Fee record deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <AdminHeader title="Fee Management" subtitle={settings.feesNote}>
        <button type="button" className="btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={15} /> New Fee Record</button>
      </AdminHeader>

      <DataTable
        loading={loading}
        columns={[
          { key: 'student', label: 'Student', render: (f) => (
            <div><p className="font-bold">{f.student ? `${f.student.firstName} ${f.student.lastName}` : '—'}</p>
            <p className="text-xs text-muted">{f.student?.rollNumber} · {f.student?.class?.name || ''}</p></div>
          ) },
          { key: 'title', label: 'Fee', render: (f) => `${f.title} (${f.session})` },
          { key: 'totalAmount', label: 'Total', render: (f) => inr(f.totalAmount) },
          { key: 'paidAmount', label: 'Paid', render: (f) => <span className="text-emerald-600 font-semibold">{inr(f.paidAmount)}</span> },
          { key: 'pending', label: 'Pending', render: (f) => <span className="text-red-500 font-semibold">{inr(f.pendingAmount)}</span> },
          { key: 'dueDate', label: 'Due', render: (f) => fmtDate(f.dueDate) },
          { key: 'status', label: 'Status', render: (f) => <span className={cx('badge', statusColor[f.status])}>{f.status}</span> },
          { key: 'actions', label: '', render: (f) => (
            <div className="flex justify-end gap-1">
              {f.status !== 'Paid' && <button type="button" className="btn-icon text-emerald-600" title="Record payment" aria-label="Record payment" onClick={() => { setPayTarget(f); setPayForm((p) => ({ ...p, amount: f.pendingAmount })); }}><IndianRupee size={15} /></button>}
              <button type="button" className="btn-icon" title="Payment history" aria-label="Payment history" onClick={() => setHistory(f)}><History size={15} /></button>
              <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(f)} aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          ) },
        ]}
        rows={data.items}
        page={data.page} pages={data.pages} onPage={setPage}
        toolbar={(
          <Select className="w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option><option>Pending</option><option>Partial</option><option>Paid</option>
          </Select>
        )}
        empty={{ title: 'No fee records', message: 'Create a fee record for a student to start tracking payments.' }}
      />

      {/* Create fee */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Fee Record">
        <form onSubmit={createFee} className="space-y-4" noValidate>
          <Field label="Student Roll Number" required><Input placeholder="RPS1001" value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value.toUpperCase() }))} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fee Title" required><Input value={form.title} onChange={set('title')} required /></Field>
            <Field label="Session" required><Input value={form.session} onChange={set('session')} required /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total Amount (₹)" required><Input type="number" min="0" value={form.totalAmount} onChange={set('totalAmount')} required /></Field>
            <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={set('dueDate')} /></Field>
          </div>
          <Field label="Note"><Input value={form.note} onChange={set('note')} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Create</button>
          </div>
        </form>
      </Modal>

      {/* Record payment */}
      <Modal open={!!payTarget} onClose={() => setPayTarget(null)} title={`Record Payment — ${payTarget?.student?.firstName || ''} ${payTarget?.student?.lastName || ''}`}>
        <form onSubmit={addPayment} className="space-y-4" noValidate>
          <p className="rounded-xl bg-line/40 p-3 text-sm">Pending balance: <span className="font-bold text-red-500">{inr(payTarget?.pendingAmount)}</span></p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (₹)" required><Input type="number" min="1" max={payTarget?.pendingAmount} value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} required /></Field>
            <Field label="Method"><Select value={payForm.method} onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))}>{['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'].map((m) => <option key={m}>{m}</option>)}</Select></Field>
          </div>
          <Field label="Note"><Input value={payForm.note} onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))} /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setPayTarget(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Record Payment</button>
          </div>
        </form>
      </Modal>

      {/* Receipt */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Payment Receipt" size="max-w-md">
        {receipt && (
          <div className="print-area rounded-2xl border border-line p-6">
            <div className="border-b border-dashed border-line pb-4 text-center">
              <p className="font-display text-xl font-semibold">{settings.site.schoolName}</p>
              <p className="text-xs text-muted">{settings.site.address}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-accent-600">Fee Receipt</p>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ['Receipt No', receipt.payment.receiptNo], ['Date', fmtDate(receipt.payment.date)],
                ['Student', `${receipt.fee.student?.firstName || ''} ${receipt.fee.student?.lastName || ''}`],
                ['Roll No', receipt.fee.student?.rollNumber], ['Fee', `${receipt.fee.title} (${receipt.fee.session})`],
                ['Amount Paid', inr(receipt.payment.amount)], ['Method', receipt.payment.method],
                ['Balance After Payment', inr(receipt.fee.pendingAmount)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-6 flex justify-between border-t border-dashed border-line pt-4 text-xs text-muted">
              <span>Authorized Signature</span><span>School Seal</span>
            </div>
          </div>
        )}
        <button type="button" className="btn-outline mt-4 w-full no-print" onClick={() => window.print()}><Printer size={15} /> Print Receipt</button>
      </Modal>

      {/* Payment history */}
      <Modal open={!!history} onClose={() => setHistory(null)} title={`Payment History — ${history?.student?.firstName || ''}`}>
        {history?.payments?.length ? (
          <ul className="space-y-2">
            {history.payments.map((p) => (
              <li key={p._id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
                <div><p className="font-bold">{inr(p.amount)} <span className="text-xs font-medium text-muted">via {p.method}</span></p>
                <p className="text-xs text-muted">{fmtDate(p.date)} · {p.receiptNo}</p></div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No payments recorded yet.</p>}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete fee record?" message={`Delete the ${deleting?.title} record of ${deleting?.student?.firstName}? Payment history will also be removed.`} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { fmtDate, toInputDate } from '../../utils/format.js';

const BLANK = { firstName: '', lastName: '', gender: 'Male', dob: '', rollNumber: '', class: '', fatherName: '', motherName: '', phone: '', email: '', address: { line1: '', city: 'Muzaffarnagar', district: 'Muzaffarnagar', state: 'Uttar Pradesh', pincode: '' } };

export default function Students() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', student }
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);
  const debounced = useDebounce(search);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/students?page=${page}&limit=10&search=${encodeURIComponent(debounced)}${classId ? `&classId=${classId}` : ''}`);
      setData(res.data);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [page, debounced, classId]);
  useEffect(() => { api.get('/classes').then(({ data }) => setClasses(data.data.items)).catch(() => {}); }, []);

  const openCreate = () => { setForm(BLANK); setModal({ mode: 'create' }); };
  const openEdit = (s) => {
    setForm({ ...BLANK, ...s, class: s.class?._id || s.class, dob: toInputDate(s.dob), address: { ...BLANK.address, ...(s.address || {}) } });
    setModal({ mode: 'edit', student: s });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') { await api.post('/students', form); toast.success('Student added'); }
      else { await api.put(`/students/${modal.student._id}`, form); toast.success('Student updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/students/${deleting._id}`); toast.success('Student deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setAddr = (k) => (e) => setForm((f) => ({ ...f, address: { ...f.address, [k]: e.target.value } }));

  return (
    <div>
      <AdminHeader title="Students" subtitle={`${data.total} students enrolled`}>
        <button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Add Student</button>
      </AdminHeader>

      <DataTable
        loading={loading}
        columns={[
          { key: 'rollNumber', label: 'Roll No', render: (s) => <span className="font-bold">{s.rollNumber}</span> },
          { key: 'name', label: 'Name', render: (s) => `${s.firstName} ${s.lastName}` },
          { key: 'class', label: 'Class', render: (s) => (s.class ? `${s.class.name}${s.class.section !== 'A' ? ` (${s.class.section})` : ''}` : '—') },
          { key: 'gender', label: 'Gender' },
          { key: 'fatherName', label: "Father's Name" },
          { key: 'phone', label: 'Phone' },
          { key: 'dob', label: 'DOB', render: (s) => fmtDate(s.dob) },
          { key: 'actions', label: '', render: (s) => (
            <div className="flex justify-end gap-1">
              <button type="button" className="btn-icon" onClick={() => openEdit(s)} aria-label="Edit"><Pencil size={15} /></button>
              <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(s)} aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          ) },
        ]}
        rows={data.items}
        search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        page={data.page} pages={data.pages} onPage={setPage}
        toolbar={classes.length > 0 && (
          <Select className="w-40" value={classId} onChange={(e) => { setClassId(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name} {c.section !== 'A' ? c.section : ''}</option>)}
          </Select>
        )}
        empty={{ title: 'No students found', message: 'Try a different search, or add the first student.' }}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Student' : 'Edit Student'} size="max-w-2xl">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="First Name" required><Input value={form.firstName} onChange={set('firstName')} required /></Field>
          <Field label="Last Name"><Input value={form.lastName} onChange={set('lastName')} /></Field>
          <Field label="Roll Number" required><Input value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value.toUpperCase() }))} required /></Field>
          <Field label="Class" required>
            <Select value={form.class} onChange={set('class')} required>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.section})</option>)}
            </Select>
          </Field>
          <Field label="Gender" required>
            <Select value={form.gender} onChange={set('gender')}><option>Male</option><option>Female</option><option>Other</option></Select>
          </Field>
          <Field label="Date of Birth" required><Input type="date" value={form.dob} onChange={set('dob')} required /></Field>
          <Field label="Father's Name" required><Input value={form.fatherName} onChange={set('fatherName')} required /></Field>
          <Field label="Mother's Name" required><Input value={form.motherName} onChange={set('motherName')} required /></Field>
          <Field label="Phone" required><Input value={form.phone} onChange={set('phone')} required /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Address" className="sm:col-span-2"><Input value={form.address.line1} onChange={setAddr('line1')} /></Field>
          <Field label="City"><Input value={form.address.city} onChange={setAddr('city')} /></Field>
          <Field label="PIN Code"><Input value={form.address.pincode} onChange={setAddr('pincode')} maxLength={6} /></Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Save Student</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete student?" message={`This will permanently remove ${deleting?.firstName} ${deleting?.lastName} (${deleting?.rollNumber}). Related results, fees and attendance will remain but lose their link.`} />
    </div>
  );
}

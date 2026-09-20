import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Power, KeyRound, X, Pencil } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDate, cx } from '../../utils/format.js';

const BLANK = { name: '', email: '', password: '', role: 'parent', phone: '', students: [], teacher: '' };
const ROLE_COLORS = { admin: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300', teacher: 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', parent: 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200', student: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };

export default function Users() {
  const { user: me } = useAuth();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = creating a new account; a user object = editing that one
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get(`/users?page=${page}&limit=10${role ? `&role=${role}` : ''}&search=${encodeURIComponent(search)}`); setData(res.data); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, [page, role, search]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/students?limit=50').then(({ data }) => setStudents(data.data.items)).catch(() => {}); }, []);
  useEffect(() => { api.get('/teachers?all=true').then(({ data }) => setTeachers(data.data.items)).catch(() => {}); }, []);

  const openCreate = () => { setEditing(null); setForm(BLANK); setModal(true); };

  // Pre-fills from effectiveStudents (the already-resolved list the
  // backend computes from whichever of the legacy `student` field or the
  // new `students` array actually has data — see
  // server/models/User.js#toSafeJSON). This is also the one moment an old
  // single-child account's legacy link gets folded into the new array:
  // the admin opens this form (which loads the resolved list), adds a
  // second child, and saves — the PUT payload naturally carries both
  // children in `students` from then on. Nothing is migrated in bulk;
  // this is the only place it happens, one account at a time, only when
  // an admin actually touches that account.
  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '',
      students: (u.effectiveStudents || []).map((s) => s._id || s),
      teacher: u.teacher?._id || u.teacher || '',
    });
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); setForm(BLANK); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const linking = { students: form.role === 'parent' || form.role === 'student' ? form.students : [], teacher: form.role === 'teacher' ? (form.teacher || null) : null };
      if (editing) {
        const { password, ...rest } = form; // password isn't editable here — use Reset Password for that
        const { data: res } = await api.put(`/users/${editing._id}`, { ...rest, ...linking });
        toast.success(res.message || 'User updated');
      } else {
        const { data: res } = await api.post('/users', { ...form, ...linking });
        toast.success(res.message);
      }
      closeModal(); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const toggle = async (u) => {
    try { const { data: res } = await api.patch(`/users/${u._id}/toggle`); toast.success(res.message); load(); }
    catch (err) { toast.error(err.message); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.patch(`/users/${resetTarget._id}/password`, { newPassword }); toast.success('Password reset'); setResetTarget(null); setNewPassword(''); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/users/${deleting._id}`); toast.success('User deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div>
      <AdminHeader title="User Accounts" subtitle="Admins, teachers and parent/student portal accounts">
        <button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> New User</button>
      </AdminHeader>

      <DataTable
        loading={loading}
        columns={[
          { key: 'name', label: 'Name', render: (u) => (
            <div><p className="font-semibold">{u.name}{u._id === me?._id && <span className="badge ml-2 bg-accent-100 text-accent-700">You</span>}</p><p className="text-xs text-muted">{u.email}</p></div>
          ) },
          { key: 'role', label: 'Role', render: (u) => <span className={cx('badge capitalize', ROLE_COLORS[u.role])}>{u.role}</span> },
          { key: 'linked', label: 'Linked To', render: (u) => {
            if (u.role === 'teacher') return u.teacher ? u.teacher.name : '—';
            if (u.effectiveStudents?.length) {
              return u.effectiveStudents.map((s) => `${s.firstName} ${s.lastName} (${s.rollNumber})`).join(', ');
            }
            return '—';
          } },
          { key: 'isActive', label: 'Status', render: (u) => <span className={cx('badge', u.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-50 text-red-600')}>{u.isActive ? 'Active' : 'Disabled'}</span> },
          { key: 'lastLogin', label: 'Last Login', render: (u) => u.lastLogin ? fmtDate(u.lastLogin) : '—' },
          { key: 'actions', label: '', render: (u) => (
            <div className="flex justify-end gap-1">
              <button type="button" className="btn-icon" title="Edit" aria-label="Edit" onClick={() => openEdit(u)}><Pencil size={15} /></button>
              <button type="button" className="btn-icon" title="Reset password" aria-label="Reset password" onClick={() => setResetTarget(u)}><KeyRound size={15} /></button>
              {u._id !== me?._id && (
                <>
                  <button type="button" className="btn-icon" title={u.isActive ? 'Deactivate' : 'Activate'} aria-label={u.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggle(u)}><Power size={15} /></button>
                  <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(u)} aria-label="Delete"><Trash2 size={15} /></button>
                </>
              )}
            </div>
          ) },
        ]}
        rows={data.items}
        search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        page={data.page} pages={data.pages} onPage={setPage}
        toolbar={(
          <Select className="w-36" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option><option>admin</option><option>teacher</option><option>parent</option><option>student</option>
          </Select>
        )}
        empty={{ title: 'No users' }}
      />

      <Modal open={modal} onClose={closeModal} title={editing ? `Edit User — ${editing.name}` : 'Create User Account'}>
        <form onSubmit={save} className="space-y-4" noValidate>
          <Field label="Full Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role"><Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}><option>parent</option><option>student</option><option>teacher</option><option>admin</option></Select></Field>
            {!editing && <Field label="Password (min 8 chars)" required><Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} /></Field>}
          </div>
          {editing && <p className="rounded-xl bg-line/40 p-3 text-xs text-muted">To change this account's password, close this and use the key icon instead.</p>}
          {(form.role === 'parent' || form.role === 'student') && (
            <Field label={form.role === 'parent' ? 'Link Children' : 'Link Student Record'} hint={form.role === 'parent' ? 'A parent account can be linked to more than one child.' : "The portal shows this student's own attendance, results and fees."}>
              <div className="space-y-2">
                {form.students.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {form.students.map((id) => {
                      const s = students.find((x) => x._id === id);
                      return (
                        <li key={id} className="flex items-center gap-1.5 rounded-lg bg-line/50 py-1 pl-3 pr-1.5 text-xs font-semibold">
                          {s ? `${s.firstName} ${s.lastName} (${s.rollNumber})` : id}
                          <button type="button" className="rounded p-0.5 hover:bg-line" onClick={() => setForm((f) => ({ ...f, students: f.students.filter((x) => x !== id) }))} aria-label={`Remove ${s ? s.firstName : 'student'}`}><X size={12} /></button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {(form.role === 'parent' || form.students.length === 0) && (
                  <Select value="" onChange={(e) => { const id = e.target.value; if (id) setForm((f) => ({ ...f, students: f.students.includes(id) ? f.students : [...f.students, id] })); }}>
                    <option value="">— Add a student —</option>
                    {students.filter((s) => !form.students.includes(s._id)).map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>)}
                  </Select>
                )}
              </div>
            </Field>
          )}
          {form.role === 'teacher' && (
            <Field label="Link to Teacher Profile" hint="Required for this account to see its assigned classes and students in the Teacher Portal.">
              <Select value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}>
                <option value="">— None —</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.name} — {t.designation}</option>)}
              </Select>
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} {editing ? 'Save Changes' : 'Create Account'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password — ${resetTarget?.name}`} size="max-w-sm">
        <form onSubmit={resetPassword} className="space-y-4" noValidate>
          <Field label="New Password (min 8 chars)" required><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setResetTarget(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Reset</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete user?" message={`Delete the account of ${deleting?.name} (${deleting?.email})?`} />
    </div>
  );
}

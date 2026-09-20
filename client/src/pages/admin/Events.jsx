import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, CalendarDays, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { Field, Input, Select, Textarea, FileInput } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/StateViews.jsx';
import api from '../../services/api.js';
import { fmtDate, toInputDate } from '../../utils/format.js';

const BLANK = { title: '', description: '', date: '', time: '', location: 'School Campus', category: 'Cultural', registrationRequired: false, isPublished: true };
const CATEGORIES = ['Cultural', 'Sports', 'Academic', 'National', 'Meeting', 'Celebration'];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [image, setImage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/events?all=true'); setEvents(data.data.items); }
    catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(BLANK); setImage(null); setModal({ mode: 'create' }); };
  const openEdit = (ev) => { setForm({ ...BLANK, ...ev, date: toInputDate(ev.date) }); setImage(null); setModal({ mode: 'edit', event: ev }); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append('image', image);
    try {
      if (modal.mode === 'create') { await api.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Event created'); }
      else { await api.put(`/events/${modal.event._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Event updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    setSaving(true);
    try { await api.delete(`/events/${deleting._id}`); toast.success('Event deleted'); setDeleting(null); load(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <AdminHeader title="Events" subtitle={`${events.length} events on the calendar`}>
        <button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> New Event</button>
      </AdminHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-56" />)}</div>
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events yet" action={<button type="button" className="btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Create Event</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev, i) => (
            <motion.div key={ev._id} className="card overflow-hidden" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="relative h-36">
                <img src={ev.image || '/images/hero-campus.jpg'} alt={ev.title} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-navy-950/80 to-transparent p-3">
                  <span className="text-sm font-bold text-white">{fmtDate(ev.date)}</span>
                  <span className={`badge ${new Date(ev.date) >= new Date() ? 'bg-emerald-400 text-navy-950' : 'bg-white/80 text-navy-900'}`}>{new Date(ev.date) >= new Date() ? 'Upcoming' : 'Past'}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{ev.title}</p>
                    <p className="text-xs font-semibold text-accent-600">{ev.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="btn-icon" onClick={() => openEdit(ev)} aria-label="Edit"><Pencil size={14} /></button>
                    <button type="button" className="btn-icon hover:text-red-500" onClick={() => setDeleting(ev)} aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted">{ev.description}</p>
                <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-muted">
                  {ev.time && <span className="flex items-center gap-1"><Clock size={12} />{ev.time}</span>}
                  <span className="flex items-center gap-1"><MapPin size={12} />{ev.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Create Event' : 'Edit Event'} size="max-w-2xl">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Event Title" required className="sm:col-span-2"><Input value={form.title} onChange={set('title')} required /></Field>
          <Field label="Description" required className="sm:col-span-2"><Textarea rows={3} value={form.description} onChange={set('description')} required /></Field>
          <Field label="Date" required><Input type="date" value={form.date} onChange={set('date')} required /></Field>
          <Field label="Time"><Input placeholder="e.g. 9:00 AM" value={form.time} onChange={set('time')} /></Field>
          <Field label="Location"><Input value={form.location} onChange={set('location')} /></Field>
          <Field label="Category"><Select value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Event Image" className="sm:col-span-2"><FileInput file={image} label="Upload image (optional)" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setImage(e.target.files?.[0] || null)} /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 rounded border-line text-brand-600" checked={form.registrationRequired} onChange={(e) => setForm((f) => ({ ...f, registrationRequired: e.target.checked }))} /> Registration Required</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 rounded border-line text-brand-600" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} /> Visible on Website</label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <ButtonSpinner />} Save Event</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} loading={saving}
        title="Delete event?" message={`Delete “${deleting?.title}”?`} />
    </div>
  );
}

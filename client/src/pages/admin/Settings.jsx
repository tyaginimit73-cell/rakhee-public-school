import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, Globe } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { Field, Input, Textarea } from '../../components/common/Field.jsx';
import { ButtonSpinner, FullPageLoader } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';

// Section wrapper
function Section({ title, note, children }) {
  return (
    <div className="card p-6">
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {note && <p className="mt-1 mb-4 text-sm text-muted">{note}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(JSON.parse(JSON.stringify(settings))); }, [settings]);
  if (!form) return <FullPageLoader />;

  // helpers for nested updates
  const set = (path) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => {
      const copy = JSON.parse(JSON.stringify(f));
      const keys = path.split('.');
      let obj = copy;
      keys.slice(0, -1).forEach((k) => { obj[k] = obj[k] || {}; obj = obj[k]; });
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const setStat = (i, k, v) => setForm((f) => {
    const copy = JSON.parse(JSON.stringify(f));
    copy.stats[i][k] = k === 'value' ? Number(v) || 0 : v;
    return copy;
  });

  // Facilities & Activities editor helpers
  const updateGroup = (gi, patch) => setForm((f) => {
    const copy = JSON.parse(JSON.stringify(f));
    copy.facilities[gi] = { ...copy.facilities[gi], ...patch };
    return copy;
  });
  const updateItem = (gi, ii, patch) => setForm((f) => {
    const copy = JSON.parse(JSON.stringify(f));
    copy.facilities[gi].items[ii] = { ...copy.facilities[gi].items[ii], ...patch };
    return copy;
  });
  const addItem = (gi) => setForm((f) => {
    const copy = JSON.parse(JSON.stringify(f));
    copy.facilities[gi].items.push({ label: '', available: true });
    return copy;
  });
  const removeItem = (gi, ii) => setForm((f) => {
    const copy = JSON.parse(JSON.stringify(f));
    copy.facilities[gi].items.splice(ii, 1);
    return copy;
  });
  const addGroup = () => setForm((f) => ({ ...f, facilities: [...(f.facilities || []), { group: 'New Group', items: [] }] }));
  const removeGroup = (gi) => setForm((f) => ({ ...f, facilities: f.facilities.filter((_, j) => j !== gi) }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/settings', form);
      toast.success(data.message);
      await refresh(); // instantly reflect on the public site
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div>
      <AdminHeader title="Website Settings" subtitle="Everything here updates the live website instantly — no code changes needed.">
        <button type="button" className="btn-primary" onClick={save} disabled={saving}>{saving ? <ButtonSpinner /> : <Save size={16} />} Save All Changes</button>
      </AdminHeader>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent-300/60 bg-accent-50 p-4 text-sm text-accent-800 dark:border-accent-500/30 dark:bg-accent-500/10 dark:text-accent-300">
        <Globe size={17} className="mt-0.5 shrink-0" />
        <p>Demo values and placeholders are shown throughout — replace them with the school's official details (phone, email, affiliation, principal name, statistics) before going live.</p>
      </div>

      <div className="space-y-6">
        <Section title="School Identity" note="Name, contact and official details shown across the website.">
          <Field label="School Name"><Input value={form.site.schoolName} onChange={set('site.schoolName')} /></Field>
          <Field label="Tagline"><Input value={form.site.tagline} onChange={set('site.tagline')} /></Field>
          <Field label="Address" className="sm:col-span-2"><Input value={form.site.address} onChange={set('site.address')} /></Field>
          <Field label="Phone (placeholder — update)"><Input value={form.site.phone} onChange={set('site.phone')} /></Field>
          <Field label="Email"><Input type="email" value={form.site.email} onChange={set('site.email')} /></Field>
          <Field label="Established Year"><Input value={form.site.establishedYear} onChange={set('site.establishedYear')} /></Field>
          <Field label="School Hours"><Input value={form.site.hours} onChange={set('site.hours')} /></Field>
          <Field label="Affiliation"><Input value={form.site.affiliation} onChange={set('site.affiliation')} /></Field>
          <Field label="Board"><Input value={form.site.board} onChange={set('site.board')} /></Field>
        </Section>

        <Section title="Homepage Hero & Announcement">
          <Field label="Hero Headline" className="sm:col-span-2"><Input value={form.hero.headline} onChange={set('hero.headline')} /></Field>
          <Field label="Hero Subtext" className="sm:col-span-2"><Textarea rows={2} value={form.hero.subtext} onChange={set('hero.subtext')} /></Field>
          <Field label="Hero Image Path"><Input value={form.hero.image} onChange={set('hero.image')} /></Field>
          <div>
            <span className="label">Admissions Open?</span>
            <label htmlFor="admissions-open" className="flex h-[42px] items-center gap-2 text-sm font-semibold">
              <input id="admissions-open" type="checkbox" className="h-4 w-4 rounded border-line text-brand-600" checked={!!form.admissionOpen} onChange={set('admissionOpen')} />
              Show “Admissions Open” across the site
            </label>
          </div>
          <Field label="Announcement Bar (leave empty to hide)" className="sm:col-span-2"><Input value={form.announcement} onChange={set('announcement')} /></Field>
        </Section>

        <Section title="Statistics" note="Shown as animated counters on the homepage (first 5 used).">
          {form.stats.map((s, i) => (
            <div key={i} className="flex items-end gap-2 sm:col-span-1">
              <Field label={`Label`} className="flex-1"><Input value={s.label} onChange={(e) => setStat(i, 'label', e.target.value)} /></Field>
              <Field label="Value"><Input type="number" className="w-24" value={s.value} onChange={(e) => setStat(i, 'value', e.target.value)} /></Field>
              <Field label="Suffix"><Input className="w-16" value={s.suffix || ''} onChange={(e) => setStat(i, 'suffix', e.target.value)} /></Field>
              <button type="button" className="btn-icon mb-1 hover:text-red-500" onClick={() => setForm((f) => ({ ...f, stats: f.stats.filter((_, j) => j !== i) }))} aria-label="Remove stat"><Trash2 size={15} /></button>
            </div>
          ))}
          <div className="sm:col-span-2">
            <button type="button" className="btn-outline btn-sm" onClick={() => setForm((f) => ({ ...f, stats: [...f.stats, { label: 'New Stat', value: 100, suffix: '+' }] }))}><Plus size={14} /> Add Statistic</button>
          </div>
        </Section>

        <Section title="About the School">
          <Field label="Introduction" className="sm:col-span-2"><Textarea rows={3} value={form.about.intro} onChange={set('about.intro')} /></Field>
          <Field label="Vision" className="sm:col-span-2"><Textarea rows={2} value={form.about.vision} onChange={set('about.vision')} /></Field>
          <Field label="Mission" className="sm:col-span-2"><Textarea rows={2} value={form.about.mission} onChange={set('about.mission')} /></Field>
          <Field label="Core Values (comma separated)" className="sm:col-span-2">
            <Input value={(form.about.values || []).join(', ')} onChange={(e) => set('about.values')(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} />
          </Field>
        </Section>

        <Section title="Principal's Message" note="Name & message are demo content — update with official details.">
          <Field label="Principal Name"><Input value={form.principal.name} onChange={set('principal.name')} /></Field>
          <Field label="Designation"><Input value={form.principal.designation} onChange={set('principal.designation')} /></Field>
          <Field label="Photo Path"><Input value={form.principal.photo} onChange={set('principal.photo')} /></Field>
          <div />
          <Field label="Message" className="sm:col-span-2"><Textarea rows={4} value={form.principal.message} onChange={set('principal.message')} /></Field>
        </Section>

        <Section title="Social Media" note="Paste official page URLs (placeholders shown as #).">
          <Field label="Facebook URL"><Input value={form.social.facebook} onChange={set('social.facebook')} /></Field>
          <Field label="Instagram URL"><Input value={form.social.instagram} onChange={set('social.instagram')} /></Field>
          <Field label="YouTube URL"><Input value={form.social.youtube} onChange={set('social.youtube')} /></Field>
          <Field label="Fees Disclaimer"><Input value={form.feesNote} onChange={set('feesNote')} /></Field>
        </Section>

        <Section title="Facilities & Activities" note="Shown on the Campus page as the available / not-available checklist.">
          {(form.facilities || []).map((group, gi) => (
            <div key={gi} className="rounded-2xl border border-line p-4 sm:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Input className="font-bold" value={group.group} onChange={(e) => updateGroup(gi, { group: e.target.value })} placeholder="Group name" />
                <button type="button" className="btn-icon shrink-0 hover:text-red-500" onClick={() => removeGroup(gi)} aria-label="Remove group"><Trash2 size={15} /></button>
              </div>
              <div className="space-y-2">
                {(group.items || []).map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2">
                    <Input className="flex-1 py-2 text-sm" value={item.label} onChange={(e) => updateItem(gi, ii, { label: e.target.value })} placeholder="Facility name" />
                    <label className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted">
                      <input type="checkbox" className="h-4 w-4 rounded border-line text-emerald-600 focus:ring-emerald-500" checked={!!item.available} onChange={(e) => updateItem(gi, ii, { available: e.target.checked })} />
                      Available
                    </label>
                    <button type="button" className="btn-icon h-8 w-8 shrink-0 hover:text-red-500" onClick={() => removeItem(gi, ii)} aria-label="Remove item"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-outline btn-sm mt-3" onClick={() => addItem(gi)}><Plus size={13} /> Add Item</button>
            </div>
          ))}
          <div className="sm:col-span-2">
            <button type="button" className="btn-outline btn-sm" onClick={addGroup}><Plus size={14} /> Add Group</button>
          </div>
        </Section>

        <div className="sticky bottom-4 flex justify-end">
          <button type="button" className="btn-primary shadow-lift" onClick={save} disabled={saving}>{saving ? <ButtonSpinner /> : <Save size={16} />} Save All Changes</button>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserRound, Users, MapPin, School, FileUp, ClipboardCheck, ChevronLeft, ChevronRight, CheckCircle2, PartyPopper, UploadCloud, X } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import { Field, Input, Select, Textarea, FileInput } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { cx } from '../../utils/format.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];

// Per-step zod schemas
const stepSchemas = [
  z.object({
    studentName: z.string().min(2, 'Student name is required'),
    dob: z.string().min(8, 'Date of birth is required'),
    gender: z.enum(['Male', 'Female', 'Other'], { errorMap: () => ({ message: 'Select gender' }) }),
    classApplyingFor: z.string().min(1, 'Select a class'),
  }),
  z.object({
    fatherName: z.string().min(2, "Father's name is required"),
    motherName: z.string().min(2, "Mother's name is required"),
    guardianName: z.string().optional(),
    phone: z.string().regex(/^\d{10,15}$/, 'Enter a valid phone number'),
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  }),
  z.object({
    address: z.object({
      line1: z.string().min(3, 'Address is required'),
      city: z.string().min(2, 'City is required'),
      district: z.string().min(2, 'District is required'),
      state: z.string().min(2, 'State is required'),
      pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN'),
    }),
  }),
  z.object({
    previousSchool: z.string().optional(),
    previousClass: z.string().optional(),
    previousResult: z.string().optional(),
  }),
  z.object({}),
  z.object({}),
];

const STEP_META = [
  { title: 'Student Information', icon: UserRound },
  { title: 'Parent / Guardian', icon: Users },
  { title: 'Address', icon: MapPin },
  { title: 'Previous School', icon: School },
  { title: 'Documents', icon: FileUp },
  { title: 'Review & Submit', icon: ClipboardCheck },
];

export default function Apply() {
  usePageMeta('Apply for Admission', 'Submit an online admission application to Rakhee Public School in a few simple steps.');
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const schema = useMemo(() => stepSchemas[step], [step]);
  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      studentName: '', dob: '', gender: '', classApplyingFor: '',
      fatherName: '', motherName: '', guardianName: '', phone: '', email: '',
      address: { line1: '', city: 'Muzaffarnagar', district: 'Muzaffarnagar', state: 'Uttar Pradesh', pincode: '' },
      previousSchool: '', previousClass: '', previousResult: '',
    },
  });

  const next = async () => {
    const ok = await trigger();
    if (ok) setStep((s) => Math.min(s + 1, STEP_META.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const addFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Each file must be under 5 MB');
    if (files.length >= 5) return toast.error('Maximum 5 documents allowed');
    setFiles((f) => [...f, file]);
  };

  const onSubmit = async () => {
    const ok = await trigger();
    if (!ok) return;
    setSubmitting(true);
    try {
      const values = getValues();
      const { data } = await api.post('/admissions', values);
      // Upload any documents after the application exists. The API only
      // accepts the upload when it's paired with the short-lived
      // uploadToken issued in this same response — see PROJECT_AUDIT.md.
      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => { fd.append('documents', f); fd.append('labels', f.name); });
        fd.append('uploadToken', data.data.uploadToken);
        try { await api.post(`/admissions/${data.data.applicationId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
        catch { toast.error('Application saved, but document upload failed. You can submit documents at the school office.'); }
      }
      setConfirmation(data.data);
      toast.success(data.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  if (confirmation) {
    return (
      <section className="section">
        <div className="container-x max-w-2xl">
          <motion.div className="card overflow-hidden text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-10 text-white">
              <PartyPopper size={44} className="mx-auto" />
              <h1 className="heading-2 mt-4">Application Submitted!</h1>
              <p className="mt-2 text-white/85">Thank you for choosing Rakhee Public School.</p>
            </div>
            <div className="p-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-muted">Your Application ID</p>
              <p className="mt-2 font-display text-4xl font-bold tracking-wide text-brand-600 dark:text-brand-300">{confirmation.applicationId}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Please save this ID. You can track your application status anytime using this ID and your registered phone number.
                Our admissions office will contact you for the next steps.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to={`/admissions/track?id=${confirmation.applicationId}`} className="btn-primary"><ClipboardCheck size={16} /> Track Application</Link>
                <button type="button" className="btn-outline" onClick={() => navigate('/')}>Back to Home</button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const values = getValues();
  const reviewRows = [
    ['Student Name', values.studentName], ['Date of Birth', values.dob], ['Gender', values.gender], ['Class Applying', values.classApplyingFor],
    ["Father's Name", values.fatherName], ["Mother's Name", values.motherName], ['Phone', values.phone], ['Email', values.email || '—'],
    ['Address', values.address ? `${values.address.line1}, ${values.address.city}, ${values.address.district}, ${values.address.state} — ${values.address.pincode}` : '—'],
    ['Previous School', values.previousSchool || '—'], ['Documents', files.length ? `${files.length} file(s) attached` : 'None (can submit at office)'],
  ];

  return (
    <>
      <PageHero title="Online Admission Application" subtitle="Complete the form below — it takes about 5 minutes. Fields marked * are required." crumbs={[{ label: 'Admissions', to: '/admissions' }, { label: 'Apply' }]} />
      <section className="section">
        <div className="container-x max-w-3xl">
          {/* Stepper */}
          <ol className="mb-10 flex items-center">
            {STEP_META.map(({ title, icon: Icon }, i) => (
              <li key={title} className={cx('flex items-center', i < STEP_META.length - 1 && 'flex-1')}>
                <div className="flex flex-col items-center gap-1.5">
                  <span className={cx('grid h-11 w-11 place-items-center rounded-full border-2 font-bold transition-all',
                    i < step ? 'border-emerald-500 bg-emerald-500 text-white' : i === step ? 'border-brand-600 bg-brand-600 text-white shadow-glow' : 'border-line bg-surface text-muted')}>
                    {i < step ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </span>
                  <span className={cx('hidden text-[11px] font-bold sm:block', i === step ? 'text-brand-600 dark:text-brand-300' : 'text-muted')}>{title}</span>
                </div>
                {i < STEP_META.length - 1 && <div className={cx('mx-2 h-0.5 flex-1 rounded transition-colors', i < step ? 'bg-emerald-500' : 'bg-line')} aria-hidden />}
              </li>
            ))}
          </ol>

          <div className="card p-6 sm:p-9">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                <h2 className="font-display text-2xl font-semibold">Step {step + 1}: {STEP_META[step].title}</h2>
                <div className="mt-6 space-y-5">
                  {step === 0 && (
                    <>
                      <Field label="Student's Full Name" required error={errors.studentName?.message}>
                        <Input placeholder="e.g. Aarav Sharma" {...register('studentName')} />
                      </Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Date of Birth" required error={errors.dob?.message}>
                          <Input type="date" max={new Date().toISOString().slice(0, 10)} {...register('dob')} />
                        </Field>
                        <Field label="Gender" required error={errors.gender?.message}>
                          <Select {...register('gender')}>
                            <option value="">Select gender</option>
                            <option>Male</option><option>Female</option><option>Other</option>
                          </Select>
                        </Field>
                      </div>
                      <Field label="Class Applying For" required error={errors.classApplyingFor?.message}>
                        <Select {...register('classApplyingFor')}>
                          <option value="">Select class</option>
                          {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                        </Select>
                      </Field>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Father's Name" required error={errors.fatherName?.message}><Input {...register('fatherName')} /></Field>
                        <Field label="Mother's Name" required error={errors.motherName?.message}><Input {...register('motherName')} /></Field>
                      </div>
                      <Field label="Guardian's Name (if different)" error={errors.guardianName?.message}><Input {...register('guardianName')} /></Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Phone (for all communication)" required error={errors.phone?.message}>
                          <Input inputMode="tel" placeholder="10-digit mobile" {...register('phone')} />
                        </Field>
                        <Field label="Email" error={errors.email?.message}><Input type="email" placeholder="you@example.com" {...register('email')} /></Field>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <Field label="Address" required error={errors.address?.line1?.message}><Input placeholder="House no., village / street" {...register('address.line1')} /></Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="City / Town" required error={errors.address?.city?.message}><Input {...register('address.city')} /></Field>
                        <Field label="District" required error={errors.address?.district?.message}><Input {...register('address.district')} /></Field>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="State" required error={errors.address?.state?.message}><Input {...register('address.state')} /></Field>
                        <Field label="PIN Code" required error={errors.address?.pincode?.message}><Input inputMode="numeric" maxLength={6} placeholder="251001" {...register('address.pincode')} /></Field>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <p className="rounded-xl bg-line/40 p-3.5 text-sm text-muted">Skip this step if the child is entering school for the first time.</p>
                      <Field label="Previous School Name" error={errors.previousSchool?.message}><Input {...register('previousSchool')} /></Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Previous Class" error={errors.previousClass?.message}><Input placeholder="e.g. Class 4" {...register('previousClass')} /></Field>
                        <Field label="Last Result / Percentage" error={errors.previousResult?.message}><Input placeholder="e.g. 82%" {...register('previousResult')} /></Field>
                      </div>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <p className="text-sm text-muted">Upload scanned documents (optional — you may also submit photocopies at the school office). Max 5 files, 5 MB each. JPG / PNG / PDF accepted.</p>
                      <FileInput label="Click to attach a document" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => addFile(e.target.files?.[0])} />
                      {files.length > 0 && (
                        <ul className="space-y-2">
                          {files.map((f, i) => (
                            <li key={i} className="flex items-center justify-between rounded-xl border border-line bg-line/20 px-4 py-2.5 text-sm">
                              <span className="flex items-center gap-2 truncate"><UploadCloud size={15} className="text-brand-600 dark:text-brand-300" />{f.name}</span>
                              <button type="button" className="btn-icon h-7 w-7" onClick={() => setFiles((arr) => arr.filter((_, j) => j !== i))} aria-label="Remove file"><X size={14} /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}

                  {step === 5 && (
                    <>
                      <p className="text-sm text-muted">Please review your details carefully before submitting.</p>
                      <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                        {reviewRows.map(([k, v]) => (
                          <div key={k} className="grid grid-cols-2 gap-2 bg-line/10 px-4 py-3 text-sm sm:grid-cols-3">
                            <dt className="font-semibold text-muted">{k}</dt>
                            <dd className="break-words font-medium text-ink sm:col-span-2">{v || '—'}</dd>
                          </div>
                        ))}
                      </dl>
                      <label className="flex items-start gap-2.5 text-sm text-muted">
                        <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" />
                        I certify that the information provided is true to the best of my knowledge.
                      </label>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
              <button type="button" className="btn-outline" onClick={back} disabled={step === 0 || submitting}>
                <ChevronLeft size={16} /> Back
              </button>
              {step < STEP_META.length - 1 ? (
                <button type="button" className="btn-primary" onClick={next}>Continue <ChevronRight size={16} /></button>
              ) : (
                <button type="button" className="btn-accent" onClick={onSubmit} disabled={submitting}>
                  {submitting ? <ButtonSpinner /> : <CheckCircle2 size={16} />} Submit Application
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import { Field, Input, Textarea } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone').max(15),
  subject: z.string().min(2, 'Subject is required'),
  message: z.string().min(10, 'Message should be at least 10 characters'),
});

export default function Contact() {
  usePageMeta('Contact Us', 'Get in touch with Rakhee Public School — address, phone, email and enquiry form.');
  const { settings } = useSettings();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/contact', values);
      toast.success(data.message);
      reset();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const info = [
    { icon: MapPin, label: 'Address', value: settings.site.address },
    { icon: Phone, label: 'Phone', value: settings.site.phone },
    { icon: Mail, label: 'Email', value: settings.site.email },
    { icon: Clock, label: 'Office Hours', value: settings.site.hours },
  ];

  return (
    <>
      <PageHero title="Contact Us" subtitle="We would love to hear from you — visit the campus or send us a message." crumbs={[{ label: 'Contact' }]} />
      <section className="section">
        <div className="container-x grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading center={false} eyebrow="Get in Touch" title="Rakhee Public School" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="card flex gap-4 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-300"><Icon size={19} /></span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">{label}</p>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card mt-6 overflow-hidden">
              <iframe
                title="Rakhee Public School location map — SohanJani Tagan, Muzaffarnagar"
                src="https://www.google.com/maps?q=Sohanjani%20Tagan%2C%20Muzaffarnagar%2C%20Uttar%20Pradesh&output=embed"
                className="h-64 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6 sm:p-8" noValidate>
            <h3 className="font-display text-2xl font-semibold">Send us a message</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={errors.name?.message}><Input placeholder="Your full name" {...register('name')} /></Field>
              <Field label="Phone" required error={errors.phone?.message}><Input inputMode="tel" placeholder="10-digit mobile" {...register('phone')} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required error={errors.email?.message}><Input type="email" placeholder="you@example.com" {...register('email')} /></Field>
              <Field label="Subject" required error={errors.subject?.message}><Input placeholder="e.g. Admission enquiry" {...register('subject')} /></Field>
            </div>
            <Field label="Message" required error={errors.message?.message}>
              <Textarea rows={5} placeholder="How can we help you?" {...register('message')} />
            </Field>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? <ButtonSpinner /> : <Send size={16} />} Send Message
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

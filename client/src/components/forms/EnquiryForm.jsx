import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../../services/api.js';
import { Field, Input, Select, Textarea } from '../common/Field.jsx';
import { ButtonSpinner } from '../common/Loader.jsx';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  phone: z.string().min(10, 'Enter a valid phone number').max(15),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  classInterested: z.string().optional(),
  message: z.string().optional(),
});

export default function EnquiryForm({ className = '' }) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/enquiries', values);
      toast.success(data.message);
      reset();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`card space-y-4 p-6 sm:p-8 ${className}`} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your Name" required error={errors.name?.message}>
          <Input placeholder="Parent / Guardian name" {...register('name')} />
        </Field>
        <Field label="Phone" required error={errors.phone?.message}>
          <Input placeholder="10-digit mobile number" inputMode="tel" {...register('phone')} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email (optional)" error={errors.email?.message}>
          <Input type="email" placeholder="you@example.com" {...register('email')} />
        </Field>
        <Field label="Class Interested In" error={errors.classInterested?.message}>
          <Select {...register('classInterested')}>
            <option value="">Select class</option>
            {['Nursery', 'LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)].map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Message (optional)" error={errors.message?.message}>
        <Textarea rows={3} placeholder="Any specific question about admission, transport, fees…" {...register('message')} />
      </Field>
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? <ButtonSpinner /> : <Send size={16} />} Request Callback
      </button>
    </form>
  );
}

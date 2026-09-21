import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LogIn, ShieldCheck, Users } from 'lucide-react';
import Logo from '../../components/common/Logo.jsx';
import { Field, Input } from '../../components/common/Field.jsx';
import { ButtonSpinner } from '../../components/common/Loader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login({ adminOnly = false }) {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const ROLE_HOME = { admin: '/admin', teacher: '/teacher', student: '/student', parent: '/parent' };
  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      if (adminOnly && user.role !== 'admin') {
        await logout();
        throw new Error('This page is for administrators only. Please use the portal login.');
      }
      const dest = adminOnly ? '/admin' : (location.state?.from || ROLE_HOME[user.role] || '/parent');
      navigate(dest, { replace: true });
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const fillDemo = (email, password) => { setValue('email', email); setValue('password', password); };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 20% 25%, #2754e3 0, transparent 45%), radial-gradient(circle at 85% 80%, #c99a22 0, transparent 40%)' }} aria-hidden />
        <div className="relative"><Link to="/"><Logo light /></Link></div>
        <div className="relative">
          <h1 className="font-display text-4xl font-semibold leading-tight">Welcome back to the <span className="text-gradient-gold">RPS family</span></h1>
          <p className="mt-4 max-w-md text-white/70">Access the parent portal or admin dashboard to track attendance, results, fees, admissions and school updates.</p>
        </div>
        <p className="relative text-xs text-white/50">SohanJani Tagan · Muzaffarnagar · Uttar Pradesh</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="font-display text-3xl font-semibold">{adminOnly ? 'Admin Sign in' : 'Sign in'}</h2>
          <p className="mt-2 text-sm text-muted">{adminOnly ? 'Use your administrator credentials.' : 'Use the credentials provided by the school office.'}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <Field label="Email Address" required error={errors.email?.message}>
              <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
            </Field>
            <Field label="Password" required error={errors.password?.message}>
              <Input type="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
            </Field>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? <ButtonSpinner /> : <LogIn size={16} />} Sign In
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-8 rounded-2xl border border-dashed border-line bg-line/20 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Demo accounts (click to fill) — dev only, never shown in production</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => fillDemo('admin@rps.school', 'Admin@12345')} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-left text-xs hover:border-brand-500">
                  <ShieldCheck size={15} className="shrink-0 text-brand-600 dark:text-brand-300" />
                  <span><span className="block font-bold">Admin</span><span className="text-muted">admin@rps.school</span></span>
                </button>
                <button type="button" onClick={() => fillDemo('parent@demo.rps', 'Parent@12345')} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-left text-xs hover:border-brand-500">
                  <Users size={15} className="shrink-0 text-accent-600" />
                  <span><span className="block font-bold">Parent</span><span className="text-muted">parent@demo.rps</span></span>
                </button>
              </div>
            </div>
          )}
          <p className="mt-6 text-center text-sm text-muted">
            {adminOnly ? <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">Portal login</Link> : <Link to="/admin/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">Admin login</Link>}
            {' · '}
            <Link to="/" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">Back to website</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShieldAlert, ServerCrash, Compass } from 'lucide-react';

function ErrorShell({ code, icon: Icon, title, message }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.div className="max-w-md text-center" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-600/10 text-brand-600 dark:text-brand-300"><Icon size={30} /></span>
        <p className="mt-6 font-display text-6xl font-bold text-gradient-gold">{code}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted">{message}</p>
        <Link to="/" className="btn-primary mt-6"><Home size={16} /> Back to Home</Link>
      </motion.div>
    </div>
  );
}

export const NotFound = () => (
  <ErrorShell code="404" icon={Compass} title="Page not found"
    message="The page you are looking for may have been moved, renamed or never existed." />
);
export const Forbidden = () => (
  <ErrorShell code="403" icon={ShieldAlert} title="Access restricted"
    message="You do not have permission to view this page. Please sign in with the right account." />
);
export const ServerError = () => (
  <ErrorShell code="500" icon={ServerCrash} title="Something went wrong"
    message="Our servers hit a snag. Please try again in a little while." />
);

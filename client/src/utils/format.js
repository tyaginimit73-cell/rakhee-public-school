import clsx from 'clsx';

export const cx = clsx;

export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-IN', opts) : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

export const ADMISSION_STATUSES = ['Submitted', 'Under Review', 'Shortlisted', 'Approved', 'Rejected'];
export const NOTICE_CATEGORIES = ['General', 'Academic', 'Examination', 'Admission', 'Holiday', 'Event', 'News'];

export const statusColor = {
  Submitted: 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200',
  'Under Review': 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Shortlisted: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Rejected: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  Paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Partial: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Pending: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  New: 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200',
  Contacted: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Closed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  inactive: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300',
};

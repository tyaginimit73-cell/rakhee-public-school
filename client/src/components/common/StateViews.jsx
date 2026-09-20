import { Inbox, AlertTriangle } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message = 'There is no data to display right now.', action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-line/50 text-muted"><Icon size={26} /></div>
      <p className="font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Could not load data', message = 'Something went wrong while fetching data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-red-300/60 bg-red-50/40 px-6 py-14 text-center dark:bg-red-950/20">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-500 dark:bg-red-900/40"><AlertTriangle size={26} /></div>
      <p className="font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn-outline btn-sm mt-1">Try again</button>}
    </div>
  );
}

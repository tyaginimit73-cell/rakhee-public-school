import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-muted">Page <span className="font-semibold text-ink">{page}</span> of {pages}</p>
      <div className="flex gap-2">
        <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={14} /> Prev</button>
        <button type="button" className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

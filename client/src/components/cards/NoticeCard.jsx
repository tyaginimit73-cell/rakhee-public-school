import { Link } from 'react-router-dom';
import { Download, Pin } from 'lucide-react';
import { fmtDate, cx } from '../../utils/format.js';

export default function NoticeCard({ notice, compact = false }) {
  return (
    <article className={cx('card group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift', notice.isImportant && 'border-l-4 border-l-accent-400')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">{notice.category}</span>
            <time className="font-medium text-muted">{fmtDate(notice.publishDate)}</time>
            {notice.isImportant && <span className="badge bg-accent-100 text-accent-700"><Pin size={11} /> Important</span>}
          </div>
          <h3 className="font-bold text-ink group-hover:text-brand-600">{notice.title}</h3>
          {!compact && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{notice.description}</p>}
        </div>
        {notice.attachmentPath && (
          <a href={notice.attachmentPath} target="_blank" rel="noreferrer" className="btn-icon shrink-0" title={`Download ${notice.attachmentName || 'attachment'}`} aria-label="Download attachment">
            <Download size={17} />
          </a>
        )}
      </div>
    </article>
  );
}

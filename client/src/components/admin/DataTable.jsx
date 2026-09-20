import { motion } from 'framer-motion';
import SearchInput from '../common/SearchInput.jsx';
import Pagination from '../common/Pagination.jsx';
import { EmptyState } from '../common/StateViews.jsx';
import { Inbox } from 'lucide-react';

// Reusable admin table: search + pagination + actions built in
export default function DataTable({ columns, rows, loading, search, onSearch, page, pages, onPage, empty, toolbar }) {
  return (
    <div>
      {(onSearch || toolbar) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {onSearch ? <SearchInput value={search} onChange={onSearch} className="w-full max-w-xs" /> : <span />}
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        </div>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{columns.map((c) => <td key={c.key}><div className="skeleton h-4 w-full max-w-[120px]" /></td>)}</tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="p-0"><EmptyState icon={Inbox} title={empty?.title || 'No records'} message={empty?.message || 'Records you add will appear here.'} /></td></tr>
            ) : (
              rows.map((row, i) => (
                <motion.tr key={row._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {onPage && <Pagination page={page} pages={pages} onPage={onPage} />}
    </div>
  );
}

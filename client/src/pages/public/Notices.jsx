import { useState } from 'react';
import PageHero from '../../components/common/PageHero.jsx';
import NoticeCard from '../../components/cards/NoticeCard.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import { ErrorState, EmptyState } from '../../components/common/StateViews.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { Megaphone } from 'lucide-react';
import { NOTICE_CATEGORIES, cx } from '../../utils/format.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function Notices() {
  usePageMeta('Notice Board', 'Latest notices, circulars and announcements from Rakhee Public School.');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const { data, loading, error, refetch } = useFetch(
    `/notices?page=${page}&limit=9${category ? `&category=${category}` : ''}`,
    [page, category],
  );

  const items = (data?.items || []).filter((n) =>
    !debounced || n.title.toLowerCase().includes(debounced.toLowerCase()) || n.description.toLowerCase().includes(debounced.toLowerCase()));

  return (
    <>
      <PageHero title="Notice Board" subtitle="Official announcements, circulars and updates from the school office." crumbs={[{ label: 'Notices' }]} />
      <section className="section">
        <div className="container-x">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 lg:flex-row">
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className={cx('chip', !category && 'chip-active')} onClick={() => { setCategory(''); setPage(1); }}>All</button>
              {NOTICE_CATEGORIES.map((c) => (
                <button key={c} type="button" className={cx('chip', category === c && 'chip-active')} onClick={() => { setCategory(c); setPage(1); }}>{c}</button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search notices…" className="w-full max-w-xs" />
          </div>

          {loading && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-36" />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && items.length === 0 && <EmptyState icon={Megaphone} title="No notices found" message="Try a different category or search term." />}
          {!loading && !error && items.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((n) => <NoticeCard key={n._id} notice={n} />)}
              </div>
              <Pagination page={data?.page} pages={data?.pages} onPage={setPage} />
            </>
          )}
        </div>
      </section>
    </>
  );
}

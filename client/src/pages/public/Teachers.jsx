import { useState, useMemo } from 'react';
import PageHero from '../../components/common/PageHero.jsx';
import TeacherCard from '../../components/cards/TeacherCard.jsx';
import { ErrorState, EmptyState } from '../../components/common/StateViews.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { Users } from 'lucide-react';
import { cx } from '../../utils/format.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function Teachers() {
  usePageMeta('Our Teachers', 'Meet the faculty and teaching staff of Rakhee Public School.');
  const { data, loading, error, refetch } = useFetch('/teachers');
  const [department, setDepartment] = useState('All');
  const teachers = data?.items || [];
  const departments = useMemo(() => ['All', ...(data?.departments || [])], [data]);
  const filtered = department === 'All' ? teachers : teachers.filter((t) => t.department === department);

  return (
    <>
      <PageHero title="Our Faculty" subtitle="Qualified, dedicated and caring educators who know every child by name." crumbs={[{ label: 'Faculty' }]} />
      <section className="section">
        <div className="container-x">
          {loading && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-72" />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && teachers.length === 0 && <EmptyState icon={Users} title="Faculty list coming soon" />}
          {!loading && !error && teachers.length > 0 && (
            <>
              <div className="mb-10 flex flex-wrap justify-center gap-2">
                {departments.map((d) => (
                  <button key={d} type="button" className={cx('chip', department === d && 'chip-active')} onClick={() => setDepartment(d)}>{d}</button>
                ))}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((t) => <TeacherCard key={t._id} teacher={t} />)}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

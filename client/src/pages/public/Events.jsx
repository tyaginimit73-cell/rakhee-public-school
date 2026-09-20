import PageHero from '../../components/common/PageHero.jsx';
import EventCard from '../../components/cards/EventCard.jsx';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState, EmptyState } from '../../components/common/StateViews.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { CalendarDays } from 'lucide-react';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function Events() {
  usePageMeta('School Events', 'Upcoming and past events at Rakhee Public School — annual function, sports day and more.');
  const { data, loading, error, refetch } = useFetch('/events');
  const events = data?.items || [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now).reverse();

  return (
    <>
      <PageHero title="School Events" subtitle="Functions, celebrations, competitions and meetings throughout the year." crumbs={[{ label: 'Events' }]} />
      <section className="section">
        <div className="container-x">
          {loading && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-96" />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && events.length === 0 && <EmptyState icon={CalendarDays} title="No events scheduled" message="New events will be announced here soon." />}
          {!loading && !error && upcoming.length > 0 && (
            <>
              <h2 className="mb-6 font-display text-2xl font-semibold">Upcoming Events</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => <EventCard key={e._id} event={e} />)}
              </div>
            </>
          )}
          {!loading && !error && past.length > 0 && (
            <div className="mt-14">
              <h2 className="mb-6 font-display text-2xl font-semibold text-muted">Past Events</h2>
              <div className="grid gap-6 opacity-80 md:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => <EventCard key={e._id} event={e} />)}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

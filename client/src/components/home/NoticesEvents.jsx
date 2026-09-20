import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone, CalendarDays } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import NoticeCard from '../cards/NoticeCard.jsx';
import EventCard from '../cards/EventCard.jsx';
import SectionHeading from '../common/SectionHeading.jsx';

export default function NoticesEvents() {
  const { data: notices } = useFetch('/notices?limit=3');
  const { data: events } = useFetch('/events');
  const upcomingEvents = (events?.items || []).filter((e) => new Date(e.date) >= new Date(Date.now() - 864e5)).slice(0, 2);

  return (
    <section className="section">
      <div className="container-x">
        <SectionHeading eyebrow="Stay Updated" title="Notices & upcoming events" />
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-2xl font-semibold"><Megaphone size={22} className="text-brand-600 dark:text-brand-300" /> Latest Notices</h3>
              <Link to="/notices" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:gap-2 transition-all dark:text-brand-300">View all <ArrowRight size={14} /></Link>
            </div>
            <div className="space-y-4">
              {(notices?.items || []).map((n) => <NoticeCard key={n._id} notice={n} />)}
              {!notices?.items?.length && <div className="skeleton h-32" />}
            </div>
          </div>
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-2xl font-semibold"><CalendarDays size={22} className="text-brand-600 dark:text-brand-300" /> Upcoming Events</h3>
              <Link to="/events" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:gap-2 transition-all dark:text-brand-300">View all <ArrowRight size={14} /></Link>
            </div>
            <div className="grid gap-5">
              {upcomingEvents.map((e) => <EventCard key={e._id} event={e} />)}
              {!events?.items?.length && <div className="skeleton h-44" />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

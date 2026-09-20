import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

// Rendered from Website Settings (CMS) — falls back to this list before the API responds.
export const DEFAULT_FACILITIES = [
  {
    group: 'Interests',
    items: [
      { label: 'Hobby Classes', available: false }, { label: 'Debate & Discussions', available: true },
      { label: 'Educational Tours', available: true }, { label: 'Write-ups for Magazine', available: false },
      { label: 'Creative Writing', available: false }, { label: 'Orientation Programme', available: false },
      { label: 'Drama', available: false }, { label: 'Fancy Dress', available: false },
      { label: 'Story-Telling Sessions', available: false }, { label: 'Cooking Classes', available: false },
    ],
  },
  {
    group: 'Events',
    items: [
      { label: 'Parenting Seminars', available: false }, { label: 'School Exhibition', available: false },
      { label: 'Seminars', available: false }, { label: 'Sports Day', available: true },
      { label: 'Summer Camp', available: true }, { label: 'Annual Day / Fest', available: true },
      { label: 'Art & Craft', available: true }, { label: 'Scouts & Guides', available: true },
      { label: 'Science Exhibition', available: true }, { label: 'Festival Celebrations', available: true },
      { label: 'Youth Parliament', available: false }, { label: 'Workshops', available: false },
      { label: 'Christmas Carnival', available: true }, { label: 'Blood Donation Camp', available: false },
    ],
  },
  {
    group: 'Competitions',
    items: [
      { label: 'Recitation Competition', available: false }, { label: 'Quiz Competition', available: true },
      { label: 'Declamation Contest', available: false }, { label: 'Handwriting Competition', available: false },
      { label: 'Wall Magazine Competition', available: false }, { label: 'Spelling Bee Competition', available: false },
      { label: 'Calligraphy', available: false }, { label: 'Music Competition', available: true },
      { label: 'Olympiad', available: false }, { label: 'Drawing Competition', available: false },
      { label: 'Story Writing Competition', available: false }, { label: 'Spelling Competition', available: false },
      { label: 'Dancing Competition', available: true },
    ],
  },
  {
    group: 'Sport & Fitness',
    items: [
      { label: 'Indoor Games', available: false }, { label: 'Yoga Activity', available: true },
      { label: 'Swimming Pool', available: false }, { label: 'Extra-Curricular Activities', available: true },
      { label: 'Sports', available: true }, { label: 'Aerobics', available: false },
    ],
  },
  {
    group: 'Infrastructure',
    items: [
      { label: 'Hostel', available: true }, { label: 'Kindergarten', available: false },
      { label: 'Music Rooms', available: false }, { label: 'Symposium', available: false },
      { label: 'Toilet Facilities', available: true }, { label: 'Auditorium', available: false },
      { label: 'Classrooms', available: true }, { label: 'Dance Rooms', available: false },
      { label: 'IT Infrastructure', available: true }, { label: 'Library', available: true },
      { label: 'Drinking Water', available: true }, { label: 'Gymnasium', available: false },
      { label: 'Sports Academy', available: false }, { label: 'Transport', available: false },
      { label: 'Cafeteria', available: false }, { label: 'Convenience Store', available: false },
      { label: 'Blackboards in Classrooms', available: true },
    ],
  },
  {
    group: 'Advanced Facilities',
    items: [
      { label: 'Labs', available: true }, { label: 'Security / CCTV', available: true },
      { label: 'Transfer Facility', available: false }, { label: 'Medical Facility', available: true },
      { label: 'Health & Medical Check-up', available: true }, { label: 'Cultural Exchange Programme', available: false },
    ],
  },
];

function Legend() {
  return (
    <div className="inline-flex items-center gap-5 rounded-full border border-line bg-surface px-5 py-2 text-sm font-semibold">
      <span className="flex items-center gap-1.5 text-emerald-600"><Check size={16} strokeWidth={3.5} /> Available</span>
      <span className="flex items-center gap-1.5 text-muted"><X size={16} strokeWidth={3.5} /> Not Available</span>
    </div>
  );
}

export default function FacilitiesChecklist({ data }) {
  const groups = Array.isArray(data) && data.length ? data : DEFAULT_FACILITIES;

  return (
    <div>
      <div className="flex justify-center"><Legend /></div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {groups.map(({ group, items }, gi) => {
          const availableCount = (items || []).filter((i) => i.available).length;
          return (
            <motion.div key={group} className="card overflow-hidden"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: (gi % 2) * 0.08 }}>
              <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-brand-800 to-navy-950 px-6 py-4">
                <h3 className="font-display text-lg font-semibold text-white">{group}</h3>
                <span className="badge bg-accent-400/15 text-accent-300">{availableCount} of {items?.length || 0}</span>
              </div>
              <ul className="grid gap-x-6 gap-y-1 p-6 sm:grid-cols-2">
                {(items || []).map((item) => (
                  <li key={item.label}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      item.available ? 'font-semibold text-ink hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-muted/70 hover:bg-line/40'
                    }`}>
                    {item.available ? (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                    ) : (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-line/60 text-muted/60">
                        <X size={12} strokeWidth={3.5} />
                      </span>
                    )}
                    <span className={item.available ? '' : 'line-through decoration-muted/40'}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

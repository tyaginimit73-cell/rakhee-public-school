import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import SectionHeading from '../common/SectionHeading.jsx';
import { initials } from '../../utils/format.js';

export default function Testimonials() {
  const { data } = useFetch('/testimonials');
  const items = data?.items || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const item = items[index % items.length];

  return (
    <section className="section bg-line/30 dark:bg-navy-900/40">
      <div className="container-x max-w-4xl">
        <SectionHeading eyebrow="Testimonials" title="What our parents say" />
        <div className="relative mt-12">
          <AnimatePresence mode="wait">
            <motion.figure key={item._id} className="card relative mx-auto p-8 text-center sm:p-12"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.4 }}>
              <Quote size={40} className="mx-auto text-accent-400" fill="currentColor" />
              <blockquote className="mt-6 font-display text-xl leading-relaxed text-ink sm:text-2xl">“{item.message}”</blockquote>
              <div className="mt-5 flex justify-center gap-1" aria-label={`${item.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={17} className={i < item.rating ? 'fill-accent-400 text-accent-400' : 'text-line'} />
                ))}
              </div>
              <figcaption className="mt-5 flex items-center justify-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 font-bold text-white">{initials(item.name)}</span>
                <span className="text-left">
                  <span className="block text-sm font-bold text-ink">{item.name}</span>
                  <span className="block text-xs font-semibold text-muted">{item.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button type="button" className="btn-icon border border-line" onClick={() => setIndex((index - 1 + items.length) % items.length)} aria-label="Previous testimonial"><ChevronLeft size={18} /></button>
            <div className="flex gap-2">
              {items.map((t, i) => (
                <button key={t._id} type="button" onClick={() => setIndex(i)} aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === index % items.length ? 'w-7 bg-brand-600' : 'w-2 bg-line hover:bg-muted'}`} />
              ))}
            </div>
            <button type="button" className="btn-icon border border-line" onClick={() => setIndex((index + 1) % items.length)} aria-label="Next testimonial"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

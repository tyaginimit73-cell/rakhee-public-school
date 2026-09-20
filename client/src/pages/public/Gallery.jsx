import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Images } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import Lightbox from '../../components/common/Lightbox.jsx';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState, EmptyState } from '../../components/common/StateViews.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { cx } from '../../utils/format.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function Gallery() {
  usePageMeta('Photo Gallery', 'Photos from campus life, events and celebrations at Rakhee Public School.');
  const { data, loading, error, refetch } = useFetch('/gallery');
  const [category, setCategory] = useState('All');
  const [lightbox, setLightbox] = useState(null);

  const items = data?.items || [];
  const categories = useMemo(() => ['All', ...(data?.categories || [])], [data]);
  const filtered = category === 'All' ? items : items.filter((g) => g.category === category);

  return (
    <>
      <PageHero title="Photo Gallery" subtitle="Moments from classroom learning, sports, celebrations and campus life." crumbs={[{ label: 'Gallery' }]} />
      <section className="section">
        <div className="container-x">
          {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-64" />)}</div>}
          {error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && (
            <>
              {items.length === 0 ? (
                <EmptyState icon={Images} title="Gallery is being curated" message="New photographs will be published here soon." />
              ) : (
                <>
                  <div className="mb-8 flex flex-wrap justify-center gap-2">
                    {categories.map((c) => (
                      <button key={c} type="button" className={cx('chip', category === c && 'chip-active')} onClick={() => setCategory(c)}>{c}</button>
                    ))}
                  </div>
                  <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((img, i) => (
                      <motion.figure key={img._id} layout className="group relative cursor-zoom-in overflow-hidden rounded-2xl shadow-soft"
                        initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: (i % 3) * 0.06 }}
                        onClick={() => setLightbox(i)}>
                        <img src={img.imagePath} alt={img.title} loading="lazy" className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-navy-950/85 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="font-semibold text-white">{img.title}</p>
                          <p className="text-xs text-white/70">{img.category}{img.caption ? ` — ${img.caption}` : ''}</p>
                        </figcaption>
                      </motion.figure>
                    ))}
                  </motion.div>
                </>
              )}
            </>
          )}
        </div>
      </section>
      {lightbox !== null && <Lightbox images={filtered} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />}
    </>
  );
}

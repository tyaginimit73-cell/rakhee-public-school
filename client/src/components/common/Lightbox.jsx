import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useCallback } from 'react';

export default function Lightbox({ images, index, onClose, onIndex }) {
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex]);
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, next, prev]);

  const img = images[index];
  return (
    <AnimatePresence>
      {img && (
        <motion.div className="fixed inset-0 z-[95] flex items-center justify-center bg-navy-950/90 p-4 backdrop-blur"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <button type="button" className="absolute right-4 top-4 btn-icon text-white/80 hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Close"><X size={22} /></button>
          <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 btn-icon text-white/80 hover:bg-white/10 hover:text-white" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous"><ChevronLeft size={26} /></button>
          <motion.figure key={img.imagePath} className="max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <img src={img.imagePath} alt={img.title} className="max-h-[76vh] w-full rounded-2xl object-contain" />
            <figcaption className="mt-3 text-center text-sm text-white/80"><span className="font-semibold text-white">{img.title}</span>{img.caption ? ` — ${img.caption}` : ''}</figcaption>
          </motion.figure>
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon text-white/80 hover:bg-white/10 hover:text-white" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next"><ChevronRight size={26} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

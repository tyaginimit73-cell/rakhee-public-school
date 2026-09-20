import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, size = 'max-w-lg' }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Previously this modal had no Escape handling, no focus trap, and no
  // focus restoration — a keyboard user tabbing when it opened kept
  // tabbing through the (visually hidden) page behind the backdrop, with
  // no way to close it without a mouse. Lightbox.jsx elsewhere in this
  // codebase already gets the Escape part right; this brings Modal in
  // line and adds the trap/restoration Lightbox doesn't need (it has no
  // focusable children of its own to trap between).
  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE);
    (focusables?.[0] || dialogRef.current)?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            ref={dialogRef}
            role="dialog" aria-modal="true" tabIndex={-1}
            className={`card relative z-10 max-h-[88vh] w-full ${size} overflow-y-auto p-6 outline-none`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-display text-xl font-semibold">{title}</h3>
              <button type="button" className="btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="max-w-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-500 dark:bg-red-900/40"><AlertTriangle size={26} /></div>
        <p className="text-sm text-muted">{message || 'This action cannot be undone.'}</p>
        <div className="mt-2 flex w-full gap-3">
          <button type="button" className="btn-outline flex-1" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-danger flex-1" onClick={onConfirm} disabled={loading}>{loading ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}

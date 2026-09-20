import { useEffect, useRef } from 'react';

// Shared focus management for every modal overlay in the app (Modal and the
// three mobile navigation drawers). Extracted verbatim from the focus logic
// that previously lived inline in components/common/Modal.jsx — same
// FOCUSABLE selector, same initial-focus/Escape/Tab-wrap/restore behavior —
// so all overlays get one implementation instead of four drifting copies.
//
// Behavior:
//  - on activate: remember the currently focused element, then move focus
//    into the overlay (first focusable element, or the panel itself if the
//    overlay has no focusable children)
//  - Escape calls onClose
//  - Tab / Shift+Tab wrap around inside the overlay (focus cannot reach the
//    page behind the backdrop)
//  - on deactivate/unmount: restore focus to the element that opened the
//    overlay — but only if it is still in the document (a removed trigger
//    degrades gracefully instead of throwing/stealing focus)
//
// onClose is kept in a ref (instead of being an effect dependency) so the
// trap installs exactly once per open/close cycle. Consumers pass inline
// lambdas (`onClose={() => setOpen(false)}`), which are a NEW function on
// every render; depending on the callback directly would tear the trap down
// and rebuild it on every parent re-render while open, yanking focus back to
// the first focusable element mid-interaction (e.g. on every keystroke in a
// modal form). The listener always calls the LATEST onClose, so behavior is
// unchanged — only the spurious re-runs go away.

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(ref, active, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return undefined;

    const previouslyFocused = document.activeElement;
    const focusables = ref.current?.querySelectorAll(FOCUSABLE);
    (focusables?.[0] || ref.current)?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { onCloseRef.current?.(); return; }
      if (e.key !== 'Tab') return;
      const nodes = ref.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Graceful restore: skip if the opener was unmounted while the overlay
      // was open (focus() on a detached node is a no-op at best, and bailing
      // out keeps the browser's default focus behavior instead).
      if (previouslyFocused instanceof Element && document.contains(previouslyFocused)) {
        previouslyFocused.focus?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

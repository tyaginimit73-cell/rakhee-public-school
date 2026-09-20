import { useEffect, useRef, useState } from 'react';

// Animated counter — runs when `active` becomes true
export function useCountUp(target, active, duration = 1800) {
  const [value, setValue] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (!active) return undefined;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, target, duration]);
  return value;
}

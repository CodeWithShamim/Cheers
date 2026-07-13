import { useEffect, useRef, useState } from 'react';

const REDUCED = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animated numeric count-up that works on bigint-derived display strings by
 * animating the numeric part only. Falls back to instant display under
 * prefers-reduced-motion.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(REDUCED() ? value : 0);
  const fromRef = useRef(shown);
  const frame = useRef<number>();

  useEffect(() => {
    if (REDUCED()) {
      setShown(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (value - from) * eased;
      setShown(current);
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      fromRef.current = value;
    };
  }, [value]);

  const display =
    Number.isInteger(value) && Math.abs(shown - value) < 0.005
      ? value.toLocaleString()
      : shown.toLocaleString(undefined, {
          maximumFractionDigits: value % 1 === 0 ? 0 : 2,
        });

  return <span className={className}>{display}</span>;
}

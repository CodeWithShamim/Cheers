import { useEffect, useMemo, useState } from 'react';

const COLORS = ['#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308'];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  sway: number;
}

/**
 * Dependency-free CSS confetti burst. Renders nothing under
 * prefers-reduced-motion. Unmounts itself after the burst.
 */
export function Confetti({ pieces = 120 }: { pieces?: number }) {
  const [done, setDone] = useState(false);
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const items = useMemo<Piece[]>(
    () =>
      Array.from({ length: pieces }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 1.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        size: 6 + Math.random() * 7,
        rotate: Math.random() * 360,
        sway: -40 + Math.random() * 80,
      })),
    [pieces],
  );

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 5200);
    return () => clearTimeout(t);
  }, []);

  if (reduced || done) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`
        @keyframes cheers-confetti-fall {
          0% { transform: translateY(-6vh) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(106vh) translateX(var(--sway)) rotate(720deg); opacity: 0.7; }
        }
      `}</style>
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-3vh',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            borderRadius: 1.5,
            transform: `rotate(${p.rotate}deg)`,
            animation: `cheers-confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.2,0.6,0.4,1) forwards`,
            ['--sway' as never]: `${p.sway}px`,
          }}
        />
      ))}
    </div>
  );
}

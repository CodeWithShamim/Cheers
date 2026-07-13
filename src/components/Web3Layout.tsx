/**
 * Shared "web3 dopamine" chrome: an animated aurora backdrop and a two-column
 * left/right page split. Every action page (Create, My cards, Wallet) sits on
 * this so the whole app shares one colorful, glassy, floating visual language.
 */
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cx } from './ui';

/** Animated colorful blobs + faint grid. Clipped to its own box (no page scroll). */
export function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 top-4 h-72 w-72 animate-blob rounded-full bg-fuchsia-400/40 blur-3xl dark:bg-fuchsia-600/25" />
      <div className="absolute right-0 top-24 h-80 w-80 animate-blob rounded-full bg-cyan-400/40 blur-3xl [animation-delay:-5s] dark:bg-cyan-500/20" />
      <div className="absolute bottom-8 left-1/3 h-72 w-72 animate-blob rounded-full bg-amber-400/40 blur-3xl [animation-delay:-9s] dark:bg-amber-500/20" />
      <div className="absolute -bottom-10 right-8 h-72 w-72 animate-blob rounded-full bg-violet-400/40 blur-3xl [animation-delay:-12s] dark:bg-violet-500/20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(120_120_120/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(120_120_120/0.06)_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}

/**
 * Two-column page: marketing/context on the left, the working panel on the
 * right. Stacks on mobile. The aside is sticky on large screens so it stays in
 * view while the right column scrolls.
 */
export function SplitPage({
  aside,
  children,
  className,
}: {
  aside: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('relative', className)}>
      <AuroraBackdrop />
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:gap-14">
        <aside className="lg:sticky lg:top-24">{aside}</aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

/** Gradient pill badge (the little eyebrow above a heading). */
export function Pill({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/60 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-fuchsia-700 shadow-sm backdrop-blur dark:border-fuchsia-500/30 dark:bg-white/5 dark:text-fuchsia-300">
      <Icon name={icon} className="h-4 w-4" />
      {children}
    </span>
  );
}

/** Big display heading with a fuchsia → violet → cyan gradient sweep. */
export function GradientHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl">
      <span className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent dark:from-fuchsia-400 dark:via-violet-400 dark:to-cyan-300">
        {children}
      </span>
    </h1>
  );
}

/** A single icon + label + value feature row for the left column. */
export function FeatureRow({ icon, k, v }: { icon: IconName; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-100 to-cyan-100 text-fuchsia-700 dark:from-fuchsia-500/15 dark:to-cyan-500/15 dark:text-fuchsia-300">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="text-sm leading-tight">
        <div className="font-semibold">{k}</div>
        <div className="text-stone-500 dark:text-stone-400">{v}</div>
      </div>
    </div>
  );
}

/**
 * Glassy card with an animated gradient border. Wrap panels in this for the
 * "crazy" glow look. `glow` picks the outer shadow tint.
 */
export function GlowCard({
  children,
  className,
  glow = 'violet',
}: {
  children: ReactNode;
  className?: string;
  glow?: 'violet' | 'fuchsia' | 'cyan' | 'amber';
}) {
  const shadow = {
    violet: 'shadow-violet-500/20',
    fuchsia: 'shadow-fuchsia-500/20',
    cyan: 'shadow-cyan-500/20',
    amber: 'shadow-amber-500/20',
  }[glow];
  return (
    <div
      className={cx(
        'rounded-3xl bg-gradient-to-br from-fuchsia-400/60 via-violet-400/50 to-cyan-400/60 p-[1.5px] shadow-xl dark:from-fuchsia-500/40 dark:via-violet-500/30 dark:to-cyan-500/40',
        shadow,
      )}
    >
      <div
        className={cx(
          'h-full rounded-[calc(1.5rem-1.5px)] bg-white/85 backdrop-blur-xl dark:bg-stone-950/80',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

import type { ParsedSignature } from '../protocol';
import type { CardTheme } from '../themes';
import { formatUctWithSymbol } from '../lib/format';
import { Icon } from './Icon';
import { cx } from './ui';

export function SignatureNote({
  sig,
  theme,
  mine,
  delayMs = 0,
}: {
  sig: ParsedSignature;
  theme: CardTheme;
  mine?: boolean;
  delayMs?: number;
}) {
  const amount = BigInt(sig.amount);
  return (
    <figure
      className={cx('animate-note-in break-inside-avoid p-4', theme.note, mine && 'ring-2 ring-amber-500/70')}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <figcaption className={cx('font-display text-lg font-semibold leading-tight', theme.noteName)}>
          {sig.emoji && <span className="mr-1.5">{sig.emoji}</span>}
          {sig.name}
          {mine && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">you</span>}
        </figcaption>
        {amount > 0n && (
          <span
            className={cx(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              theme.badge,
            )}
            title={
              sig.verified
                ? `Verified on-network transfer ${sig.transferId}`
                : 'This gift claims an amount but carries no transfer proof'
            }
          >
            {sig.verified ? <Icon name="check" className="h-3.5 w-3.5" /> : <span aria-hidden>?</span>}
            {formatUctWithSymbol(amount)}
            {!sig.verified && (
              <span className="ml-1 font-normal opacity-70">unverified</span>
            )}
          </span>
        )}
      </div>
      {sig.note && <blockquote className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{sig.note}</blockquote>}
    </figure>
  );
}

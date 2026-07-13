import type { ParsedCard } from '../protocol';
import type { CardTheme } from '../themes';
import { UCT_DECIMALS } from '../lib/format';
import { CountUp } from './CountUp';
import { cx } from './ui';

/** bigint base units → approximate number for the animated banner only. */
function toApproxNumber(baseUnits: bigint): number {
  return Number(baseUnits / 10n ** BigInt(UCT_DECIMALS - 2)) / 100;
}

export function TotalBanner({
  card,
  theme,
  highlight,
}: {
  card: ParsedCard;
  theme: CardTheme;
  highlight?: boolean;
}) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-baseline justify-center gap-x-2 rounded-2xl px-6 py-4 text-center',
        theme.banner,
        highlight && 'ring-2 ring-amber-400',
      )}
    >
      <span className="font-display text-2xl font-bold sm:text-3xl">
        <CountUp value={card.signerCount} />
        {` friend${card.signerCount === 1 ? '' : 's'} signed`}
      </span>
      {card.total > 0n && (
        <span className="font-display text-2xl font-bold sm:text-3xl">
          {' · chipped in '}
          <CountUp value={toApproxNumber(card.total)} />
          {' UCT'}
        </span>
      )}
      {card.unverifiedTotal > 0n && (
        <span className="w-full text-xs opacity-60">
          (+ unverified claims not counted in the total)
        </span>
      )}
    </div>
  );
}

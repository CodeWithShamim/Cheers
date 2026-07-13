import { formatUct, safeParseUct } from '../lib/amounts';
import { cx, inputClass } from './ui';

const QUICK_CHIPS = ['1', '5', '10'];

/**
 * UCT amount entry. Value is the raw human string; parent derives bigint via
 * safeParseUct. Never a float anywhere.
 */
export function AmountInput({
  value,
  onChange,
  suggested,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  suggested?: bigint;
  disabled?: boolean;
}) {
  const parsed = value.trim() === '' ? 0n : safeParseUct(value);
  const invalid = parsed === null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          inputMode="decimal"
          placeholder="0"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Gift amount in UCT"
          aria-invalid={invalid}
          className={cx(inputClass, 'pr-14 text-lg font-semibold', invalid && 'border-red-500')}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-stone-400">
          UCT
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => onChange(chip)}
            className={cx(
              'press rounded-full border px-3.5 py-1.5 text-sm font-semibold',
              value === chip
                ? 'border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                : 'border-stone-300 text-stone-600 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300',
            )}
          >
            {chip} UCT
          </button>
        ))}
        {suggested !== undefined && suggested > 0n && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(formatUct(suggested))}
            className="press rounded-full border border-dashed border-amber-400 px-3.5 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300"
          >
            Suggested: {formatUct(suggested)} UCT
          </button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('0')}
          className={cx(
            'press rounded-full border px-3.5 py-1.5 text-sm',
            value === '0'
              ? 'border-amber-500 bg-amber-100 font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200'
              : 'border-stone-300 text-stone-500 dark:border-stone-700 dark:text-stone-400',
          )}
        >
          Just sign, no gift
        </button>
      </div>
      {invalid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          Enter a plain number like 5 or 1.5.
        </p>
      )}
    </div>
  );
}

import { THEMES, type CardTheme } from '../themes';
import { cx } from './ui';

export function ThemePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Card theme" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Object.values(THEMES).map((theme) => (
        <ThemeSwatch key={theme.key} theme={theme} selected={value === theme.key} onSelect={() => onChange(theme.key)} />
      ))}
    </div>
  );
}

function ThemeSwatch({
  theme,
  selected,
  onSelect,
}: {
  theme: CardTheme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        'press overflow-hidden rounded-2xl border-2 text-left',
        selected ? 'border-amber-500 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100',
      )}
    >
      <div className={cx('p-3', theme.page)}>
        <div className={cx('rounded-lg px-3 py-2 text-xs font-semibold', theme.header)}>
          {theme.emoji} {theme.label}
        </div>
        <div className={cx('mt-2 px-3 py-2 text-[10px]', theme.note)}>
          <span className={theme.noteName}>Rafi</span> · so happy for you!
        </div>
      </div>
    </button>
  );
}

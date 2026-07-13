/**
 * Card themes. Each is a full visual treatment: page background, header art,
 * accent, and note-card styling. Class strings are static so Tailwind's
 * scanner picks them up.
 */
import type { Occasion } from './protocol';
import type { IconName } from './components/Icon';

export interface CardTheme {
  key: string;
  label: string;
  /** Emoji used in pickers and as default header art. */
  emoji: string;
  /** Solid icon used in pickers and card headers. */
  icon: IconName;
  /** Full-page background behind the card. */
  page: string;
  /** Card header block. */
  header: string;
  /** Title text inside the header. */
  title: string;
  /** Subtitle / recipient line. */
  subtitle: string;
  /** A signature note card. */
  note: string;
  /** Note author name. */
  noteName: string;
  /** Amount badge on a note. */
  badge: string;
  /** Primary action button. */
  button: string;
  /** Total banner. */
  banner: string;
}

export const THEMES: Record<string, CardTheme> = {
  sunset: {
    key: 'sunset',
    label: 'Sunset',
    emoji: '🌅',
    icon: 'sun',
    page: 'bg-gradient-to-b from-orange-100 via-rose-50 to-amber-50 dark:from-[#2a1410] dark:via-[#221016] dark:to-[#1c1208]',
    header:
      'bg-gradient-to-br from-orange-400 via-rose-400 to-amber-300 dark:from-orange-700 dark:via-rose-800 dark:to-amber-700 text-white shadow-lg shadow-orange-900/20',
    title: 'font-display text-white drop-shadow-sm',
    subtitle: 'text-orange-50/90',
    note: 'bg-white/90 dark:bg-stone-900/80 border border-orange-200/60 dark:border-orange-900/40 shadow-md shadow-orange-900/5 rounded-2xl',
    noteName: 'text-orange-800 dark:text-orange-300',
    badge:
      'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border border-orange-300/50 dark:border-orange-800',
    button:
      'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-600/25',
    banner:
      'bg-white/70 dark:bg-stone-900/70 border border-orange-200/70 dark:border-orange-900/40 backdrop-blur',
  },
  confetti: {
    key: 'confetti',
    label: 'Confetti',
    emoji: '🎉',
    icon: 'sparkles',
    page: 'bg-gradient-to-b from-sky-50 via-fuchsia-50 to-yellow-50 dark:from-[#101a26] dark:via-[#1d1226] dark:to-[#221d0e]',
    header:
      'bg-gradient-to-br from-sky-400 via-fuchsia-400 to-yellow-300 dark:from-sky-700 dark:via-fuchsia-700 dark:to-yellow-600 text-white shadow-lg shadow-fuchsia-900/20',
    title: 'font-display text-white drop-shadow-sm',
    subtitle: 'text-sky-50/90',
    note: 'bg-white/90 dark:bg-stone-900/80 border border-fuchsia-200/60 dark:border-fuchsia-900/40 shadow-md shadow-fuchsia-900/5 rounded-2xl',
    noteName: 'text-fuchsia-800 dark:text-fuchsia-300',
    badge:
      'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200 border border-fuchsia-300/50 dark:border-fuchsia-800',
    button:
      'bg-gradient-to-r from-sky-500 to-fuchsia-500 hover:from-sky-600 hover:to-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/25',
    banner:
      'bg-white/70 dark:bg-stone-900/70 border border-fuchsia-200/70 dark:border-fuchsia-900/40 backdrop-blur',
  },
  midnight: {
    key: 'midnight',
    label: 'Midnight',
    emoji: '🌙',
    icon: 'moon',
    page: 'bg-gradient-to-b from-indigo-950 via-slate-950 to-indigo-950 text-slate-100',
    header:
      'bg-gradient-to-br from-indigo-800 via-slate-900 to-violet-900 text-indigo-50 border border-indigo-700/40 shadow-xl shadow-indigo-950/60',
    title: 'font-display text-indigo-50',
    subtitle: 'text-indigo-200/80',
    note: 'bg-slate-900/90 border border-indigo-800/50 shadow-lg shadow-indigo-950/40 rounded-2xl text-slate-100',
    noteName: 'text-indigo-300',
    badge: 'bg-indigo-950 text-indigo-200 border border-indigo-700/60',
    button:
      'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white shadow-lg shadow-indigo-900/50',
    banner: 'bg-slate-900/70 border border-indigo-800/50 backdrop-blur text-slate-100',
  },
  garden: {
    key: 'garden',
    label: 'Garden',
    emoji: '🌿',
    icon: 'leaf',
    page: 'bg-gradient-to-b from-emerald-50 via-lime-50 to-teal-50 dark:from-[#0d1f16] dark:via-[#14200e] dark:to-[#0c1e1b]',
    header:
      'bg-gradient-to-br from-emerald-500 via-green-500 to-lime-400 dark:from-emerald-800 dark:via-green-800 dark:to-lime-700 text-white shadow-lg shadow-emerald-900/20',
    title: 'font-display text-white drop-shadow-sm',
    subtitle: 'text-emerald-50/90',
    note: 'bg-white/90 dark:bg-stone-900/80 border border-emerald-200/60 dark:border-emerald-900/40 shadow-md shadow-emerald-900/5 rounded-2xl',
    noteName: 'text-emerald-800 dark:text-emerald-300',
    badge:
      'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300/50 dark:border-emerald-800',
    button:
      'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg shadow-emerald-600/25',
    banner:
      'bg-white/70 dark:bg-stone-900/70 border border-emerald-200/70 dark:border-emerald-900/40 backdrop-blur',
  },
  minimal: {
    key: 'minimal',
    label: 'Minimal',
    emoji: '🕊️',
    icon: 'star',
    page: 'bg-[#faf8f4] dark:bg-[#171412]',
    header:
      'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 shadow-sm',
    title: 'font-display text-stone-900 dark:text-stone-100',
    subtitle: 'text-stone-500 dark:text-stone-400',
    note: 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm rounded-xl',
    noteName: 'text-stone-900 dark:text-stone-100',
    badge:
      'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700',
    button: 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 shadow-md',
    banner: 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800',
  },
};

export const DEFAULT_THEME = 'sunset';

export function getTheme(key: string | undefined): CardTheme {
  return THEMES[key ?? DEFAULT_THEME] ?? THEMES[DEFAULT_THEME]!;
}

export const OCCASION_META: Record<
  Occasion,
  { label: string; emoji: string; icon: IconName; defaultTitle: (name: string) => string }
> = {
  birthday: { label: 'Birthday', emoji: '🎂', icon: 'cake', defaultTitle: (n) => `Happy birthday, ${n}!` },
  farewell: { label: 'Farewell', emoji: '👋', icon: 'suitcase', defaultTitle: (n) => `Farewell, ${n}, we'll miss you!` },
  congrats: { label: 'Congrats', emoji: '🏆', icon: 'trophy', defaultTitle: (n) => `Congratulations, ${n}!` },
  thanks: { label: 'Thank you', emoji: '💐', icon: 'flower', defaultTitle: (n) => `Thank you, ${n}!` },
  custom: { label: 'Something else', emoji: '💌', icon: 'mail', defaultTitle: (n) => `A card for ${n}` },
};

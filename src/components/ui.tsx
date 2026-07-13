/** Tiny shared UI kit: consistent radius/shadow/press language everywhere. */
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  busy?: boolean;
}

export function Button({ variant = 'primary', busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cx(
        'press inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' &&
          'bg-stone-900 text-white hover:bg-stone-700 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 shadow-md',
        variant === 'ghost' &&
          'bg-transparent text-stone-700 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800',
        variant === 'danger' && 'bg-red-700 text-white hover:bg-red-600 shadow-md',
        className,
      )}
    >
      {busy && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      className={cx('border border-stone-300 dark:border-stone-700', className)}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? (
        <>
          <Icon name="check" className="h-4 w-4" /> Copied
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-sm text-red-700 dark:text-red-400">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-stone-500 dark:text-stone-400">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 placeholder-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100';

export function ErrorNote({ children, retry }: { children: ReactNode; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-red-300/60 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
    >
      <div>{children}</div>
      {retry && (
        <div>
          <Button variant="danger" onClick={retry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export function SkeletonNote() {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white/60 p-4 dark:border-stone-800 dark:bg-stone-900/60">
      <div className="skeleton mb-3 h-4 w-24" />
      <div className="skeleton mb-2 h-3 w-full" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  );
}

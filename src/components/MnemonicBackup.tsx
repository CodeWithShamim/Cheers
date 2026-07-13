/**
 * Forced first-run backup: reveal → copy → "I saved it" confirm.
 * Also reusable from the Wallet page for re-showing the phrase.
 */
import { useEffect, useState } from 'react';
import { getSphere } from '../sphere/client';
import { Button, CopyButton, ErrorNote, Spinner } from './ui';
import { Icon } from './Icon';

export function MnemonicBackup({
  onConfirmed,
  onRestoreInstead,
}: {
  onConfirmed: () => void;
  onRestoreInstead?: () => void;
}) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSphere()
      .then((s) => {
        if (cancelled) return;
        const phrase = s.getMnemonic();
        if (!phrase) setError('This wallet has no recoverable phrase (imported from raw keys).');
        else setMnemonic(phrase);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load wallet.'));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!mnemonic)
    return (
      <div className="flex items-center gap-3 p-6 text-stone-500">
        <Spinner /> Preparing your wallet…
      </div>
    );

  const words = mnemonic.split(' ');

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Save your recovery phrase</h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Your wallet lives only in this browser. These {words.length} words are the{' '}
          <strong>only</strong> way to recover it - if this browser data is cleared and you
          haven't saved them, any tokens in the wallet are gone.
        </p>
      </div>

      <div className="relative rounded-2xl border border-stone-300 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <ol className={`grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 ${revealed ? '' : 'blur-md select-none'}`}>
          {words.map((w, i) => (
            <li key={i} className="flex gap-2 font-mono text-sm">
              <span className="w-5 text-right text-stone-400">{i + 1}.</span>
              <span>{w}</span>
            </li>
          ))}
        </ol>
        {!revealed && (
          <button
            className="press absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-stone-100/40 font-semibold text-stone-700 dark:bg-stone-950/40 dark:text-stone-200"
            onClick={() => setRevealed(true)}
          >
            <Icon name="eye" className="h-5 w-5" /> Tap to reveal
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CopyButton text={mnemonic} label="Copy phrase" className={copied ? '' : ''} />
        <Button
          variant="ghost"
          className="border border-stone-300 dark:border-stone-700"
          onClick={async () => {
            await navigator.clipboard.writeText(mnemonic);
            setCopied(true);
          }}
        >
          {copied ? (
            <>
              <Icon name="check" className="h-4 w-4" /> In clipboard
            </>
          ) : (
            'Copy & mark as saved'
          )}
        </Button>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-amber-600"
          checked={copied}
          onChange={(e) => setCopied(e.target.checked)}
        />
        <span>I wrote these words down (or stored them in a password manager). I understand nobody can recover them for me.</span>
      </label>

      <div className="flex items-center gap-3">
        <Button disabled={!revealed || !copied} onClick={onConfirmed}>
          I saved it - continue
        </Button>
        {onRestoreInstead && (
          <Button variant="ghost" onClick={onRestoreInstead}>
            I already have a wallet
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * First-run onboarding. A brand-new visitor (no wallet persisted in this
 * browser) explicitly chooses to CREATE a fresh wallet or RESTORE one from its
 * recovery phrase, instead of us silently generating keys for them. Rendered by
 * WalletGate before the wallet is initialized.
 */
import { useState } from 'react';
import { restoreFromMnemonic } from '../sphere/client';
import { isMnemonicValid } from '../sphere/wallet';
import { confirmBackup } from '../lib/backup';
import { toHumanError } from '../lib/errors';
import { Button, Field, cx, inputClass } from './ui';
import { Icon, type IconName } from './Icon';
import { AuroraBackdrop, GradientHeading, Pill } from './Web3Layout';

export function WalletWelcome({ onCreate }: { onCreate: () => void }) {
  const [restoring, setRestoring] = useState(false);

  return (
    <div className="relative min-h-[70vh]">
      <AuroraBackdrop />
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-20">
        <div className="text-center">
          <Pill icon="wallet">In-browser wallet</Pill>
          <GradientHeading>Set up your wallet</GradientHeading>
          <p className="mt-4 text-stone-600 dark:text-stone-300">
            Cheers runs on a wallet stored only in this browser. Start a brand-new one, or bring an
            existing wallet back with its recovery phrase.
          </p>
        </div>

        {restoring ? (
          <RestorePanel onBack={() => setRestoring(false)} />
        ) : (
          <div className="mt-8 grid gap-4">
            <OptionCard
              icon="sparkles"
              title="Create a new wallet"
              body="Generate fresh keys on this device. You'll save a recovery phrase, then you're in."
              primary
              onClick={onCreate}
            />
            <OptionCard
              icon="refresh"
              title="I already have a wallet"
              body="Restore access on this device using your 12 or 24-word recovery phrase."
              onClick={() => setRestoring(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function OptionCard({
  icon,
  title,
  body,
  primary,
  onClick,
}: {
  icon: IconName;
  title: string;
  body: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'press group flex w-full items-center gap-4 rounded-2xl border p-5 text-left shadow-sm backdrop-blur-xl transition',
        primary
          ? 'border-fuchsia-300/70 bg-white/85 hover:border-fuchsia-400 dark:border-fuchsia-500/40 dark:bg-stone-950/70 dark:hover:border-fuchsia-400/70'
          : 'border-white/60 bg-white/70 hover:border-stone-300 dark:border-white/10 dark:bg-stone-950/60 dark:hover:border-stone-700',
      )}
    >
      <span
        className={cx(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          primary
            ? 'bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-sm'
            : 'bg-gradient-to-br from-fuchsia-100 to-cyan-100 text-fuchsia-700 dark:from-fuchsia-500/15 dark:to-cyan-500/15 dark:text-fuchsia-300',
        )}
      >
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg font-semibold">{title}</div>
        <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{body}</p>
      </div>
      <Icon
        name="arrowRight"
        className="h-5 w-5 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-stone-600 dark:group-hover:text-stone-200"
      />
    </button>
  );
}

function RestorePanel({ onBack }: { onBack: () => void }) {
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = isMnemonicValid(phrase);

  return (
    <div className="mt-8 space-y-4 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/70">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          disabled={busy}
          className="press -ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/60 disabled:opacity-50 dark:hover:bg-stone-800"
          aria-label="Back"
        >
          <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
        </button>
        <h2 className="font-display text-lg font-semibold">Restore your wallet</h2>
      </div>
      <Field
        label="Recovery phrase"
        hint="Your 12 or 24 words, separated by spaces. They never leave this device."
        error={error}
      >
        <textarea
          className={cx(inputClass, 'min-h-[6rem] font-mono text-sm')}
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="witch collapse practice feed shame open despair creek road again ice least"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
        />
      </Field>
      {!valid && phrase.trim().length > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400">That's not a valid BIP-39 phrase yet.</p>
      )}
      <div className="flex gap-2">
        <Button
          busy={busy}
          disabled={!valid}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await restoreFromMnemonic(phrase.trim().toLowerCase().replace(/\s+/g, ' '));
              // They supplied the phrase, so the backup is already in hand - skip
              // the forced backup step and drop them straight into the wallet.
              confirmBackup();
              window.location.href = '/wallet';
            } catch (err) {
              setError(toHumanError(err));
              setBusy(false);
            }
          }}
        >
          Restore wallet
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

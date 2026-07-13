import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MnemonicBackup } from '../components/MnemonicBackup';
import { WalletGate } from '../components/WalletGate';
import { Button, CopyButton, ErrorNote, Field, cx, inputClass } from '../components/ui';
import { Icon } from '../components/Icon';
import { toHumanError } from '../lib/errors';
import { logoutWallet, restoreFromMnemonic } from '../sphere/client';
import { checkNametag, isMnemonicValid, mintUct, registerNametag } from '../sphere/wallet';
import { resetBackupConfirmation } from '../lib/backup';
import { useWallet } from '../store';
import { toHumanReadable } from '@unicitylabs/sphere-sdk';

export default function WalletPage() {
  return (
    <WalletGate>
      <WalletBody />
    </WalletGate>
  );
}

function WalletBody() {
  const { address, nametag, assets, refreshAssets, refreshIdentity } = useWallet();
  const [params] = useSearchParams();
  const [showBackup, setShowBackup] = useState(false);
  const [showRestore, setShowRestore] = useState(params.get('restore') === '1');

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-bold">Your wallet</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Created and stored only in this browser. Testnet2 - tokens have no real value.
        </p>
      </div>

      {/* Identity */}
      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-display text-lg font-semibold">Identity</h2>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">L3 address</span>
          <div className="mt-1 flex items-center gap-2">
            <code className="block w-full truncate rounded-lg bg-stone-100 px-3 py-2 text-xs dark:bg-stone-800">
              {address ?? '…'}
            </code>
            {address && <CopyButton text={address} label="Copy" className="shrink-0" />}
          </div>
        </div>
        <NametagSection currentNametag={nametag} onRegistered={() => void refreshIdentity()} />
      </section>

      {/* Balances */}
      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Balances</h2>
          <Button variant="ghost" onClick={() => void refreshAssets()}>
            <Icon name="refresh" className="h-4 w-4" /> Refresh
          </Button>
        </div>
        {assets.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No tokens yet - mint some test UCT below.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {assets.map((a) => (
              <li key={a.coinId} className="flex items-baseline justify-between py-2">
                <span className="font-semibold">{a.symbol}</span>
                <span className="font-mono text-sm tabular-nums">
                  {toHumanReadable(BigInt(a.totalAmount), a.decimals)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <MintSection onMinted={() => void refreshAssets()} />
      </section>

      {/* Backup & restore */}
      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-display text-lg font-semibold">Backup & restore</h2>
        {showBackup ? (
          <MnemonicBackup onConfirmed={() => setShowBackup(false)} />
        ) : (
          <Button variant="ghost" className="border border-stone-300 dark:border-stone-700" onClick={() => setShowBackup(true)}>
            Show recovery phrase
          </Button>
        )}
        <hr className="border-stone-100 dark:border-stone-800" />
        {showRestore ? (
          <RestoreSection onDone={() => setShowRestore(false)} />
        ) : (
          <Button variant="ghost" className="border border-stone-300 dark:border-stone-700" onClick={() => setShowRestore(true)}>
            Restore a different wallet from its phrase
          </Button>
        )}
      </section>

      {/* Sign out */}
      <LogoutSection />
    </div>
  );
}

function LogoutSection() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <section className="space-y-4 rounded-2xl border border-red-200 bg-white p-5 dark:border-red-900/50 dark:bg-stone-900">
      <h2 className="font-display text-lg font-semibold text-red-800 dark:text-red-300">Sign out</h2>
      {confirming ? (
        <div className="space-y-4">
          <ErrorNote>
            This erases the wallet from this browser - keys, balances, nametag and your card list.
            It's permanent unless you've saved your recovery phrase above. Anyone restoring that
            phrase can bring the wallet back; without it, it's gone.
          </ErrorNote>
          <div className="flex gap-2">
            <Button
              variant="danger"
              busy={busy}
              onClick={async () => {
                setBusy(true);
                await logoutWallet();
                // Full reload: WalletGate generates a fresh wallet on the landing route.
                window.location.href = '/';
              }}
            >
              <Icon name="logout" className="h-4 w-4" /> Erase wallet & sign out
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Remove this wallet from this browser. Save your recovery phrase first - it's the only
            way to get this wallet back.
          </p>
          <Button
            variant="ghost"
            className="border border-red-300 text-red-800 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
            onClick={() => setConfirming(true)}
          >
            <Icon name="logout" className="h-4 w-4" /> Sign out
          </Button>
        </>
      )}
    </section>
  );
}

function NametagSection({
  currentNametag,
  onRegistered,
}: {
  currentNametag: string | null;
  onRegistered: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [availability, setAvailability] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.trim()) {
      setAvailability(null);
      setOk(false);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const result = await checkNametag(draft);
        setOk(result.valid && result.available === true);
        setAvailability(
          result.valid && result.available
            ? `@${draft.trim().toLowerCase().replace(/^@/, '')} is available`
            : (result.reason ?? null),
        );
      } catch {
        setAvailability('Could not check availability - network hiccup.');
        setOk(false);
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [draft]);

  if (currentNametag) {
    return (
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Nametag</span>
        <p className="mt-1 font-display text-xl font-bold text-emerald-700 dark:text-emerald-400">@{currentNametag}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Friends can send you gifts at this name. It's bound to this wallet's key, permanently.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Field
        label="Register a nametag"
        hint="Needed to RECEIVE cards & gifts by @name (signing others' cards works without one). First-come, first-served."
        error={error}
      >
        <div className="flex gap-2">
          <div className="relative w-full">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-semibold text-stone-400">@</span>
            <input
              className={cx(inputClass, 'pl-8')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="sara"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <Button
            busy={busy}
            disabled={!ok}
            className="shrink-0"
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await registerNametag(draft);
                onRegistered();
              } catch (err) {
                setError(toHumanError(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            Register
          </Button>
        </div>
      </Field>
      {availability && <p className={cx('mt-1.5 text-sm', ok ? 'text-emerald-600' : 'text-amber-700 dark:text-amber-400')}>{availability}</p>}
    </div>
  );
}

function MintSection({ onMinted }: { onMinted: () => void }) {
  const [amount, setAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800/60">
      <h3 className="text-sm font-semibold">Get test tokens</h3>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        There's no faucet on testnet2 - you mint your own UCT, straight into this wallet.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          className={cx(inputClass, 'max-w-[8rem]')}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Amount of UCT to mint"
        />
        <Button
          busy={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            setDone(false);
            try {
              await mintUct(amount);
              setDone(true);
              onMinted();
            } catch (err) {
              setError(toHumanError(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          Mint UCT
        </Button>
      </div>
      {done && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
          <Icon name="check" className="h-4 w-4" /> Minted. Tokens are in your wallet.
        </p>
      )}
      {error && <div className="mt-2"><ErrorNote>{error}</ErrorNote></div>}
    </div>
  );
}

function RestoreSection({ onDone }: { onDone: () => void }) {
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = isMnemonicValid(phrase);

  return (
    <div className="space-y-3">
      <Field
        label="Recovery phrase"
        hint="12 or 24 words. This REPLACES the wallet currently in this browser - back it up first if it holds anything."
        error={error}
      >
        <textarea
          className={cx(inputClass, 'min-h-[5rem] font-mono text-sm')}
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="witch collapse practice feed shame open despair creek road again ice least"
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>
      <div className="flex gap-2">
        <Button
          busy={busy}
          disabled={!valid}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await restoreFromMnemonic(phrase.trim().toLowerCase().replace(/\s+/g, ' '));
              resetBackupConfirmation();
              // Full reload: every module re-reads the restored wallet cleanly.
              window.location.href = '/wallet';
            } catch (err) {
              setError(toHumanError(err));
              setBusy(false);
            }
          }}
        >
          Restore wallet
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {!valid && phrase.trim().length > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400">That's not a valid BIP-39 phrase yet.</p>
      )}
    </div>
  );
}

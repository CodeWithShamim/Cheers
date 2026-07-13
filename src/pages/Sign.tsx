/**
 * Signing panel, rendered inline on the card page.
 * Flow: compose → (optional inline mint if balance short) → pay → post.
 */
import { useEffect, useState } from 'react';
import { AmountInput } from '../components/AmountInput';
import { Button, ErrorNote, Field, cx, inputClass } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatUctWithSymbol, safeParseUct } from '../lib/amounts';
import { toHumanError } from '../lib/errors';
import type { CardLinkPayload } from '../link';
import type { CardMeta } from '../protocol';
import { signCard, type SignStage } from '../sphere/cards';
import { mintUct } from '../sphere/wallet';
import { useWallet } from '../store';
import type { CardTheme } from '../themes';

const EMOJI = ['🎉', '🥂', '❤️', '🎂', '👏', '😭', '🌟', '🍀', '💐', '🚀'];

type Phase =
  | { kind: 'compose' }
  | { kind: 'progress'; stage: SignStage }
  | { kind: 'done'; queued: boolean; indeterminate: boolean }
  | { kind: 'error'; message: string };

export function SignPanel({
  payload,
  meta,
  theme,
  onClose,
  onSigned,
}: {
  payload: CardLinkPayload;
  meta: CardMeta;
  theme: CardTheme;
  onClose: () => void;
  onSigned: () => void;
}) {
  const { nametag, uctBalance, refreshAssets } = useWallet();
  const [name, setName] = useState(nametag ?? '');
  const [note, setNote] = useState('');
  const [emoji, setEmoji] = useState<string | undefined>('🎉');
  const suggested = meta.suggestedAmount ? BigInt(meta.suggestedAmount) : undefined;
  const [amountStr, setAmountStr] = useState(() =>
    suggested !== undefined && suggested > 0n ? '' : '0',
  );
  const [phase, setPhase] = useState<Phase>({ kind: 'compose' });
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);

  useEffect(() => {
    void refreshAssets();
  }, [refreshAssets]);

  useEffect(() => {
    if (nametag && !name) setName(nametag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nametag]);

  const amount = amountStr.trim() === '' ? (suggested ?? 0n) : safeParseUct(amountStr);
  const insufficient = amount !== null && amount > uctBalance;
  const canSign = name.trim().length > 0 && amount !== null && !insufficient;

  if (phase.kind === 'done') {
    return (
      <div className={cx('animate-pop-in rounded-2xl p-6 text-center', theme.banner)}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <h2 className="font-display mt-3 text-xl font-bold">You're on the card!</h2>
        {phase.indeterminate && (
          <p className="mt-2 text-sm opacity-80">
            Your gift is still being confirmed by the network, it will complete on its own.
            Don't send it again.
          </p>
        )}
        {phase.queued && (
          <p className="mt-2 text-sm opacity-80">
            Your payment went through but the relay didn't take the note yet. We saved it and
            will post it automatically next time you open Cheers.
          </p>
        )}
        <Button className="mt-4" onClick={onSigned}>
          See the card
        </Button>
      </div>
    );
  }

  if (phase.kind === 'progress') {
    const steps: Array<{ key: SignStage; label: string }> = [
      { key: 'paying', label: `Sending gift to ${meta.recipient}` },
      { key: 'posting', label: 'Signing the card' },
      { key: 'done', label: 'Done' },
    ];
    const activeIndex = steps.findIndex((s) => s.key === phase.stage);
    return (
      <div className={cx('rounded-2xl p-6', theme.banner)} role="status">
        <h2 className="font-display text-lg font-semibold">Adding you to the card…</h2>
        <ol className="mt-4 space-y-2">
          {steps.map((step, i) => (
            <li key={step.key} className="flex items-center gap-3 text-sm">
              <span
                className={cx(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  i < activeIndex && 'bg-emerald-500 text-white',
                  i === activeIndex && 'animate-pulse bg-amber-500 text-white',
                  i > activeIndex && 'bg-stone-300 text-stone-600 dark:bg-stone-700 dark:text-stone-300',
                )}
              >
                {i < activeIndex ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={i === activeIndex ? 'font-semibold' : 'opacity-70'}>{step.label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs opacity-60">
          The gift moves straight from your wallet to {meta.recipient}. Cheers never holds it.
        </p>
      </div>
    );
  }

  return (
    <div className={cx('rounded-2xl p-5 sm:p-6', theme.banner)}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Sign the card</h2>
        <Button variant="ghost" onClick={onClose} aria-label="Close signing panel">
          <Icon name="close" className="h-5 w-5" />
        </Button>
      </div>

      {phase.kind === 'error' && (
        <div className="mt-4">
          <ErrorNote retry={() => setPhase({ kind: 'compose' })}>{phase.message}</ErrorNote>
        </div>
      )}

      <div className="mt-4 space-y-5">
        <Field label="Your name" hint={nametag ? `Prefilled from your nametag @${nametag}` : 'Any name - no account needed.'}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Rafi" />
        </Field>

        <Field label={`Your note (${280 - note.length} left)`}>
          <textarea
            className={cx(inputClass, 'min-h-[5rem]')}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder="Best boss ever. Don't go!"
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">Mood</span>
          <div role="radiogroup" aria-label="Emoji" className="flex flex-wrap gap-1.5">
            {EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                role="radio"
                aria-checked={emoji === e}
                onClick={() => setEmoji(emoji === e ? undefined : e)}
                className={cx(
                  'press flex h-10 w-10 items-center justify-center rounded-xl text-xl',
                  emoji === e ? 'bg-amber-200 ring-2 ring-amber-500 dark:bg-amber-900' : 'bg-stone-200/60 dark:bg-stone-800',
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <Field label="Chip in" hint={`Your balance: ${formatUctWithSymbol(uctBalance)} - sent directly to ${meta.recipient}, peer-to-peer.`}>
          <AmountInput
            value={amountStr}
            onChange={setAmountStr}
            {...(suggested !== undefined ? { suggested } : {})}
          />
        </Field>

        {insufficient && (
          <div className="rounded-2xl border border-amber-400/60 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Not enough test tokens for this gift.
            </p>
            <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
              This is a testnet - mint yourself some UCT (free, no faucet needed) and then send the gift.
            </p>
            {mintError && (
              <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-400">{mintError}</p>
            )}
            <Button
              className="mt-3"
              busy={minting}
              onClick={async () => {
                setMinting(true);
                setMintError(null);
                try {
                  await mintUct('100');
                  await refreshAssets();
                } catch (err) {
                  setMintError(toHumanError(err));
                } finally {
                  setMinting(false);
                }
              }}
            >
              Get test tokens (mint 100 UCT)
            </Button>
          </div>
        )}

        <Button
          className={cx('w-full py-3.5 text-base', theme.button)}
          disabled={!canSign}
          onClick={async () => {
            if (amount === null) return;
            setPhase({ kind: 'progress', stage: amount > 0n ? 'paying' : 'posting' });
            try {
              const result = await signCard({
                payload,
                meta,
                name,
                note,
                ...(emoji ? { emoji } : {}),
                amount,
                onStage: (stage) => setPhase({ kind: 'progress', stage }),
              });
              void refreshAssets();
              setPhase({
                kind: 'done',
                queued: result.postQueued,
                indeterminate: result.paymentIndeterminate,
              });
            } catch (err) {
              setPhase({ kind: 'error', message: toHumanError(err) });
            }
          }}
        >
          {amount !== null && amount > 0n
            ? `Send ${formatUctWithSymbol(amount)} & sign`
            : 'Sign the card'}
        </Button>
      </div>
    </div>
  );
}

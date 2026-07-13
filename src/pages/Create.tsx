import { useEffect, useRef, useState } from 'react';
import { WalletGate } from '../components/WalletGate';
import { ShareSheet } from '../components/ShareSheet';
import { ThemePicker } from '../components/ThemePicker';
import { Button, ErrorNote, Field, Spinner, cx, inputClass } from '../components/ui';
import { Icon } from '../components/Icon';
import {
  FeatureRow,
  GlowCard,
  GradientHeading,
  Pill,
  SplitPage,
} from '../components/Web3Layout';
import { safeParseUct } from '../lib/amounts';
import { toHumanError } from '../lib/errors';
import { OCCASIONS, type Occasion } from '../protocol';
import { createCard, type CreatedCard } from '../sphere/cards';
import { resolvePeer } from '../sphere/wallet';
import { DEFAULT_THEME, OCCASION_META, getTheme } from '../themes';

type ResolveState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'found'; nametag: string }
  | { kind: 'missing'; nametag: string };

export default function Create() {
  return (
    <WalletGate>
      <CreateWizard />
    </WalletGate>
  );
}

function CreateWizard() {
  const [recipient, setRecipient] = useState('');
  const [display, setDisplay] = useState('');
  const [occasion, setOccasion] = useState<Occasion>('birthday');
  const [title, setTitle] = useState('');
  const [suggested, setSuggested] = useState('');
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [resolveState, setResolveState] = useState<ResolveState>({ kind: 'idle' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCard | null>(null);
  const debounceRef = useRef<number>();

  // Debounced live nametag resolution - the recipient must exist on-network
  // before we let the card be created (gifts go straight to their wallet).
  useEffect(() => {
    const name = recipient.trim().toLowerCase().replace(/^@/, '');
    window.clearTimeout(debounceRef.current);
    if (!name) {
      setResolveState({ kind: 'idle' });
      return;
    }
    setResolveState({ kind: 'checking' });
    debounceRef.current = window.setTimeout(async () => {
      const peer = await resolvePeer(`@${name}`);
      setResolveState(peer ? { kind: 'found', nametag: name } : { kind: 'missing', nametag: name });
    }, 500);
    return () => window.clearTimeout(debounceRef.current);
  }, [recipient]);

  const suggestedParsed = suggested.trim() === '' ? 0n : safeParseUct(suggested);
  const titleValue = title.trim() || (display.trim() ? OCCASION_META[occasion].defaultTitle(display.trim()) : '');
  const canCreate =
    resolveState.kind === 'found' &&
    display.trim().length > 0 &&
    titleValue.length > 0 &&
    suggestedParsed !== null &&
    !creating;

  if (created) {
    return (
      <SplitPage
        aside={
          <div className="max-w-md">
            <Pill icon="sparkles">Card is live on-network</Pill>
            <GradientHeading>The card is live!</GradientHeading>
            <p className="mt-5 text-lg text-stone-600 dark:text-stone-300">
              Share this link with everyone who should sign. Every signature and gift lands on the
              card in real time, straight in the recipient's wallet.
            </p>
            <div className="mt-8 grid gap-4">
              <FeatureRow icon="link" k="One link" v="drop it in any group chat" />
              <FeatureRow icon="bolt" k="Real time" v="notes appear as friends sign" />
              <FeatureRow icon="gift" k="Auto-DM'd" v="the recipient gets it when ready" />
            </div>
          </div>
        }
      >
        <GlowCard glow="fuchsia" className="p-6 sm:p-8">
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 animate-float-slow items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-violet-500/30">
              <Icon name="sparkles" className="h-8 w-8" />
            </span>
            <h2 className="font-display mt-3 text-2xl font-bold">Ready to share</h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Copy the link below and send it to everyone who should sign.
            </p>
            {!created.dmSent && (
              <p className="mx-auto mt-3 max-w-md rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                Heads-up: we couldn't DM the recipient the link automatically - send it to them
                yourself when the card is ready to open.
              </p>
            )}
          </div>
          <div className="mt-6">
            <ShareSheet url={created.url} title={titleValue} />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <a href={created.url}>
              <Button>Open the card</Button>
            </a>
          </div>
        </GlowCard>
      </SplitPage>
    );
  }

  return (
    <SplitPage
      aside={
        <div className="max-w-md">
          <Pill icon="pen">Start a group card</Pill>
          <GradientHeading>One link, everyone chips in</GradientHeading>
          <p className="mt-5 text-lg text-stone-600 dark:text-stone-300">
            Set who it's for, the occasion, and a look. You get a single link to share. Friends sign
            it with a note and send tokens straight to their wallet.
          </p>
          <div className="mt-8 grid gap-4">
            <FeatureRow icon="users" k="Everyone together" v="unlimited signers on one card" />
            <FeatureRow icon="bolt" k="Wallet-to-wallet" v="gifts land instantly, peer-to-peer" />
            <FeatureRow icon="shield" k="Yours only" v="keys never leave this browser" />
          </div>
        </div>
      }
    >
      <GlowCard className="p-6 sm:p-8">
      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canCreate || resolveState.kind !== 'found') return;
          setCreating(true);
          setError(null);
          try {
            const result = await createCard({
              recipient: `@${resolveState.nametag}`,
              recipientDisplay: display,
              occasion,
              title: titleValue,
              ...(suggestedParsed && suggestedParsed > 0n ? { suggestedAmount: suggestedParsed } : {}),
              theme,
            });
            setCreated(result);
          } catch (err) {
            setError(toHumanError(err));
          } finally {
            setCreating(false);
          }
        }}
      >
        {/* Step 1 - who */}
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">1 · Who is it for?</legend>
          <Field
            label="Their Unicity nametag"
            hint="Gifts go straight to this wallet - the nametag must already be registered."
            error={
              resolveState.kind === 'missing'
                ? `@${resolveState.nametag} doesn't exist on the network yet. Ask them to register it in their wallet first.`
                : null
            }
          >
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-semibold text-stone-400">@</span>
              <input
                className={cx(inputClass, 'pl-8')}
                placeholder="sara"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <span className="absolute inset-y-0 right-3.5 flex items-center text-sm">
                {resolveState.kind === 'checking' && <Spinner className="h-4 w-4 text-stone-400" />}
                {resolveState.kind === 'found' && (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <Icon name="check" className="h-4 w-4" /> found
                  </span>
                )}
              </span>
            </div>
          </Field>
          <Field label="Their name on the card">
            <input
              className={inputClass}
              placeholder="Sara"
              value={display}
              onChange={(e) => setDisplay(e.target.value)}
              maxLength={60}
            />
          </Field>
        </fieldset>

        {/* Step 2 - what */}
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">2 · The occasion</legend>
          <div role="radiogroup" aria-label="Occasion" className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={occasion === o}
                onClick={() => setOccasion(o)}
                className={cx(
                  'press inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold',
                  occasion === o
                    ? 'border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    : 'border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300',
                )}
              >
                <Icon name={OCCASION_META[o].icon} className="h-4 w-4" /> {OCCASION_META[o].label}
              </button>
            ))}
          </div>
          <Field label="Card title">
            <input
              className={inputClass}
              placeholder={display.trim() ? OCCASION_META[occasion].defaultTitle(display.trim()) : 'Happy 30th, Sara!'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field
            label="Suggested gift (optional)"
            hint="Shown to signers as a starting point - they can give any amount, or none."
            error={suggestedParsed === null ? 'Enter a plain number like 5 or 1.5.' : null}
          >
            <div className="relative">
              <input
                className={cx(inputClass, 'pr-14')}
                inputMode="decimal"
                placeholder="5"
                value={suggested}
                onChange={(e) => setSuggested(e.target.value)}
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-stone-400">UCT</span>
            </div>
          </Field>
        </fieldset>

        {/* Step 3 - look */}
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">3 · Pick a look</legend>
          <ThemePicker value={theme} onChange={setTheme} />
          {/* Live preview */}
          <div className={cx('rounded-2xl p-4', getTheme(theme).page)}>
            <div className={cx('rounded-xl px-5 py-6 text-center', getTheme(theme).header)}>
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                <Icon name={OCCASION_META[occasion].icon} className="h-6 w-6" />
              </span>
              <div className={cx('mt-1 text-xl font-bold', getTheme(theme).title)}>
                {titleValue || 'Your title here'}
              </div>
              <div className={cx('text-sm', getTheme(theme).subtitle)}>
                for {display.trim() || '…'}
              </div>
            </div>
          </div>
        </fieldset>

        {error && <ErrorNote>{error}</ErrorNote>}

        <Button type="submit" busy={creating} disabled={!canCreate} className="w-full py-3.5 text-base">
          {creating ? 'Creating the card on the network…' : 'Create card & get share link'}
        </Button>
      </form>
      </GlowCard>
    </SplitPage>
  );
}

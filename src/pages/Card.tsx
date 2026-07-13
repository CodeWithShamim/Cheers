import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Confetti } from '../components/Confetti';
import { SignatureNote } from '../components/SignatureNote';
import { TotalBanner } from '../components/TotalBanner';
import { WalletGate } from '../components/WalletGate';
import { Button, ErrorNote, SkeletonNote, Spinner, cx } from '../components/ui';
import { Icon } from '../components/Icon';
import { toHumanError } from '../lib/errors';
import { decodeCardToken, InvalidCardLinkError, type CardLinkPayload } from '../link';
import type { ParsedCard } from '../protocol';
import { openCard, reparseCard, sendThanks, watchCard, type OpenedCard } from '../sphere/cards';
import { getSphere } from '../sphere/client';
import { OCCASION_META, getTheme } from '../themes';
import { SignPanel } from './Sign';

export default function CardPage() {
  const location = useLocation();
  let payload: CardLinkPayload | null = null;
  let linkError: string | null = null;
  try {
    payload = decodeCardToken(location.hash);
  } catch (err) {
    linkError = err instanceof InvalidCardLinkError ? err.message : 'This card link is invalid.';
  }

  if (!payload) {
    return <BadLink message={linkError ?? 'This card link is invalid.'} />;
  }

  return (
    <WalletGate>
      <CardView payload={payload} />
    </WalletGate>
  );
}

function BadLink({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300">
        <Icon name="heartBroken" className="h-8 w-8" />
      </span>
      <h1 className="font-display mt-4 text-2xl font-bold">Can't open this card</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">{message}</p>
      <div className="mt-6">
        <Link to="/create">
          <Button>Start a new card</Button>
        </Link>
      </div>
    </div>
  );
}

function CardView({ payload }: { payload: CardLinkPayload }) {
  const [opened, setOpened] = useState<OpenedCard | null>(null);
  const [card, setCard] = useState<ParsedCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badLink, setBadLink] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [signing, setSigning] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [thanksDraft, setThanksDraft] = useState('');
  const [thanksBusy, setThanksBusy] = useState(false);
  const [thanksError, setThanksError] = useState<string | null>(null);
  const openedRef = useRef<OpenedCard | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await openCard(payload);
      openedRef.current = result;
      setOpened(result);
      setCard(result.card);
      if (result.isRecipient) {
        const key = `cheers_celebrated_${payload.groupId}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1');
          setCelebrate(true);
        }
      }
    } catch (err) {
      if (err instanceof InvalidCardLinkError) setBadLink(err.message);
      else setError(toHumanError(err));
    }
  }, [payload]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live updates: re-parse from the module cache whenever a group message lands.
  useEffect(() => {
    if (!opened) return;
    let unsub: (() => void) | undefined;
    let cancelled = false;
    void watchCard(payload.groupId, () => {
      void reparseCard(payload.groupId, opened.recipientPeer).then((fresh) => {
        if (!cancelled) setCard(fresh);
      });
    }).then((u) => {
      if (cancelled) u();
      else unsub = u;
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [opened, payload.groupId]);

  // Relay connection indicator (auto-reconnect happens inside the SDK).
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const sphere = await getSphere();
        setConnected(sphere.groupChat?.getConnectionStatus() ?? true);
      } catch {
        /* wallet not ready yet */
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  if (badLink) return <BadLink message={badLink} />;

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorNote retry={() => void load()}>{error}</ErrorNote>
      </div>
    );
  }

  if (!opened || !card) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10" role="status" aria-label="Loading card">
        <div className="skeleton h-40 w-full rounded-3xl" />
        <div className="skeleton mx-auto h-10 w-64 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonNote />
          <SkeletonNote />
          <SkeletonNote />
        </div>
      </div>
    );
  }

  if (!card.meta) {
    return (
      <BadLink message="This card exists but its contents haven't reached the relay yet (or its metadata is missing). Try again in a moment." />
    );
  }

  const meta = card.meta;
  const theme = getTheme(meta.theme);
  const occasion = OCCASION_META[meta.occasion];
  const myPubkey = opened.myPubkey;

  return (
    <div className={cx('min-h-screen pb-24', theme.page)}>
      {celebrate && <Confetti />}
      {!connected && (
        <div
          role="status"
          className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-sm font-semibold text-amber-950"
        >
          <Spinner className="h-3.5 w-3.5" /> Reconnecting to the relay…
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Header */}
        <header className={cx('rounded-3xl px-6 py-10 text-center sm:py-14', theme.header)}>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Icon name={occasion.icon} className="h-9 w-9" />
          </span>
          <h1 className={cx('mt-3 text-3xl font-bold sm:text-4xl', theme.title)}>{meta.title}</h1>
          <p className={cx('mt-2 text-lg', theme.subtitle)}>
            for {meta.recipientDisplay} ({meta.recipient})
          </p>
        </header>

        {/* Total */}
        <div className="-mt-5 flex justify-center px-4">
          <TotalBanner card={card} theme={theme} highlight={opened.isRecipient} />
        </div>

        {opened.isRecipient && (
          <RecipientPanel
            theme={theme.banner}
            thanks={card.thanks?.note ?? null}
            draft={thanksDraft}
            setDraft={setThanksDraft}
            busy={thanksBusy}
            error={thanksError}
            onSend={async () => {
              setThanksBusy(true);
              setThanksError(null);
              try {
                await sendThanks(payload.groupId, thanksDraft);
                setThanksDraft('');
                const fresh = await reparseCard(payload.groupId, opened.recipientPeer);
                setCard(fresh);
              } catch (err) {
                setThanksError(toHumanError(err));
              } finally {
                setThanksBusy(false);
              }
            }}
          />
        )}

        {/* Thanks pinned at top of wall */}
        {card.thanks && (
          <div className={cx('mt-6 animate-pop-in rounded-2xl border-2 border-amber-400/70 p-5 text-center', theme.note)}>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <Icon name="mail" className="h-4 w-4" /> {meta.recipientDisplay} says
            </div>
            <p className="mt-2 whitespace-pre-wrap font-display text-lg">{card.thanks.note}</p>
          </div>
        )}

        {/* Sign CTA */}
        {!signing && (
          <div className="sticky bottom-6 z-30 mt-8 flex justify-center">
            <button
              onClick={() => setSigning(true)}
              className={cx('press inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-lg font-bold', theme.button)}
            >
              <Icon name="pen" className="h-5 w-5" /> Sign this card
            </button>
          </div>
        )}

        {signing && (
          <div className="mt-8">
            <SignPanel
              payload={payload}
              meta={meta}
              theme={theme}
              onClose={() => setSigning(false)}
              onSigned={async () => {
                setSigning(false);
                const fresh = await reparseCard(payload.groupId, opened.recipientPeer);
                setCard(fresh);
              }}
            />
          </div>
        )}

        {/* Wall */}
        <section aria-label="Signatures" className="mt-8">
          {card.signatures.length === 0 ? (
            <div className={cx('rounded-2xl p-10 text-center', theme.banner)}>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/10">
                <Icon name="pen" className="h-7 w-7 opacity-70" />
              </span>
              <h2 className="font-display mt-3 text-xl font-semibold">No signatures yet</h2>
              <p className="mt-2 text-sm opacity-70">
                Be the first to sign, or share the link so friends can pile in.
              </p>
            </div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 [&>*]:mb-4">
              {card.signatures.map((sig, i) => (
                <SignatureNote
                  key={sig.messageId}
                  sig={sig}
                  theme={theme}
                  mine={myPubkey !== null && sig.senderPubkey === myPubkey}
                  delayMs={Math.min(i * 70, 700)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RecipientPanel({
  theme,
  thanks,
  draft,
  setDraft,
  busy,
  error,
  onSend,
}: {
  theme: string;
  thanks: string | null;
  draft: string;
  setDraft: (v: string) => void;
  busy: boolean;
  error: string | null;
  onSend: () => Promise<void>;
}) {
  return (
    <div className={cx('mt-6 rounded-2xl p-5', theme)}>
      <h2 className="font-display flex items-center gap-2 text-lg font-semibold">
        <Icon name="gift" className="h-5 w-5 text-fuchsia-500" /> This card is for you!
      </h2>
      <p className="mt-1 text-sm opacity-70">
        Every gift above was sent straight to your wallet. {thanks ? 'Update your thank-you note:' : 'Say thanks to everyone:'}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="You're all amazing 😭"
          aria-label="Thank-you note"
          className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <Button busy={busy} disabled={draft.trim().length === 0} onClick={() => void onSend()} className="shrink-0 self-end">
          Post thanks
        </Button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>}
    </div>
  );
}

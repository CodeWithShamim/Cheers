import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WalletGate } from '../components/WalletGate';
import { Button, Spinner, cx } from '../components/ui';
import { Icon } from '../components/Icon';
import { FeatureRow, GlowCard, GradientHeading, Pill, SplitPage } from '../components/Web3Layout';
import { forgetCard, listMyCards, type CardRole } from '../lib/mycards';
import { rebuildMyCardsFromNetwork } from '../sphere/cards';
import { OCCASION_META, getTheme } from '../themes';

const ROLE_LABEL: Record<CardRole, string> = {
  created: 'You created this',
  signed: 'You signed this',
  received: 'For you',
};

const ROLE_TINT: Record<CardRole, string> = {
  created: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  signed: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

function MyCardsAside({ count }: { count: number }) {
  return (
    <div className="max-w-md">
      <Pill icon="inbox">Your card wallet</Pill>
      <GradientHeading>Every card, in one place</GradientHeading>
      <p className="mt-5 text-lg text-stone-600 dark:text-stone-300">
        Cards you create, sign, or receive collect here. This list lives only on this device. The
        cards themselves live on the Unicity network.
      </p>
      <div className="mt-8 grid gap-4">
        <FeatureRow icon="users" k="Created" v="cards you started for someone" />
        <FeatureRow icon="pen" k="Signed" v="cards you added a note to" />
        <FeatureRow icon="gift" k="Received" v="cards friends made for you" />
      </div>
      {count > 0 && (
        <div className="mt-8">
          <Link to="/create">
            <Button className="bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white hover:from-fuchsia-500 hover:to-violet-500">
              <Icon name="pen" className="h-4 w-4" /> Start another card
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function MyCards() {
  return (
    <WalletGate>
      <MyCardsList />
    </WalletGate>
  );
}

function MyCardsList() {
  const [cards, setCards] = useState(listMyCards);
  // Refresh from the wallet's on-network groups each visit, so cards restored
  // after a logout + login (the local list is wiped on logout) reappear here.
  const [rebuilding, setRebuilding] = useState(() => listMyCards().length === 0);

  useEffect(() => {
    let cancelled = false;
    void rebuildMyCardsFromNetwork()
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setCards(listMyCards());
        setRebuilding(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (cards.length === 0) {
    if (rebuilding) {
      return (
        <SplitPage aside={<MyCardsAside count={0} />}>
          <GlowCard glow="cyan" className="flex flex-col items-center px-6 py-14 text-center">
            <Spinner className="h-8 w-8 text-fuchsia-500" />
            <p className="mt-4 text-stone-600 dark:text-stone-400">Looking for your cards on the network…</p>
          </GlowCard>
        </SplitPage>
      );
    }
    return (
      <SplitPage aside={<MyCardsAside count={0} />}>
        <GlowCard glow="cyan" className="flex flex-col items-center px-6 py-14 text-center">
          <span className="mx-auto flex h-16 w-16 animate-float-slow items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-cyan-500/15 text-fuchsia-500">
            <Icon name="inbox" className="h-8 w-8" />
          </span>
          <h2 className="font-display mt-4 text-2xl font-bold">No cards yet</h2>
          <p className="mt-2 max-w-sm text-stone-600 dark:text-stone-400">
            Start your first card and it will show up right here.
          </p>
          <div className="mt-6">
            <Link to="/create">
              <Button className="bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white hover:from-fuchsia-500 hover:to-violet-500">
                Start a card
              </Button>
            </Link>
          </div>
        </GlowCard>
      </SplitPage>
    );
  }

  return (
    <SplitPage aside={<MyCardsAside count={cards.length} />}>
      <ul className="space-y-3">
        {cards.map((card) => {
          const theme = getTheme(card.theme);
          return (
            <li
              key={card.groupId}
              className="press flex items-center gap-4 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-lg hover:shadow-violet-500/10 dark:border-white/10 dark:bg-stone-950/70"
            >
              <div className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', theme.header)}>
                <Icon name={OCCASION_META[card.occasion].icon} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <a href={card.link} className="font-display block truncate text-lg font-semibold hover:underline">
                  {card.title}
                </a>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                  <span className={cx('rounded-full px-2 py-0.5 font-semibold', ROLE_TINT[card.role])}>
                    {ROLE_LABEL[card.role]}
                  </span>
                  <span>for {card.recipientDisplay}</span>
                  <span className="text-stone-400">·</span>
                  <span>{new Date(card.lastOpened).toLocaleDateString()}</span>
                </p>
              </div>
              <a href={card.link} className="shrink-0">
                <Button variant="ghost" className="border border-stone-300 dark:border-stone-700">
                  Open
                </Button>
              </a>
              <button
                aria-label={`Remove ${card.title} from this list`}
                className="press shrink-0 rounded-lg p-2 text-stone-400 hover:text-red-600"
                onClick={() => {
                  forgetCard(card.groupId);
                  setCards(listMyCards());
                }}
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </li>
          );
        })}
      </ul>
    </SplitPage>
  );
}

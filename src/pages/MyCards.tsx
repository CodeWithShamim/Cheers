import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, cx } from '../components/ui';
import { Icon } from '../components/Icon';
import { forgetCard, listMyCards, type CardRole } from '../lib/mycards';
import { OCCASION_META, getTheme } from '../themes';

const ROLE_LABEL: Record<CardRole, string> = {
  created: 'You created this',
  signed: 'You signed this',
  received: 'For you',
};

export default function MyCards() {
  const [cards, setCards] = useState(listMyCards);

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 dark:bg-stone-800">
          <Icon name="inbox" className="h-8 w-8" />
        </span>
        <h1 className="font-display mt-4 text-2xl font-bold">No cards yet</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Cards you create, sign, or receive will show up here. This list lives only on this
          device - the cards themselves live on the Unicity network.
        </p>
        <div className="mt-6">
          <Link to="/create">
            <Button>Start a card</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">My cards</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        A device-local list of links - the cards themselves live on-network.
      </p>
      <ul className="mt-6 space-y-3">
        {cards.map((card) => {
          const theme = getTheme(card.theme);
          return (
            <li
              key={card.groupId}
              className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', theme.header)}>
                <Icon name={OCCASION_META[card.occasion].icon} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <a href={card.link} className="font-display block truncate text-lg font-semibold hover:underline">
                  {card.title}
                </a>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {ROLE_LABEL[card.role]} · for {card.recipientDisplay} ·{' '}
                  {new Date(card.lastOpened).toLocaleDateString()}
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
    </div>
  );
}

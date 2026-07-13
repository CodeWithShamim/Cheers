import { Link } from 'react-router-dom';
import { getTheme } from '../themes';
import { cx } from '../components/ui';

const demoNotes = [
  { name: 'Rafi', emoji: '🎉', note: "Best boss ever. Don't go!", amount: '10 UCT' },
  { name: 'Priya', emoji: '💜', note: 'The kitchen will be quieter without your laugh.', amount: '5 UCT' },
  { name: 'Tom', emoji: '🥂', note: 'To the next adventure!', amount: null },
  { name: 'Ana', emoji: '🌟', note: 'You taught me everything. Thank you.', amount: '25 UCT' },
];

export default function Landing() {
  const theme = getTheme('sunset');
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-14 text-center sm:pt-20">
        <h1 className="font-display mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
          The group card where everyone
          <span className="text-[rgb(190_62_40)] dark:text-amber-400"> chips in real money</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600 dark:text-stone-300">
          Start a card for someone's birthday, farewell, or big win. Friends sign it with a note —
          and send tokens straight to the recipient's wallet. They open one page with every message
          and everything friends gave them.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/create"
            className={cx('press rounded-2xl px-7 py-3.5 text-lg font-bold', theme.button)}
          >
            Start a card
          </Link>
          <Link
            to="/mine"
            className="press rounded-2xl border border-stone-300 px-7 py-3.5 text-lg font-semibold text-stone-700 dark:border-stone-700 dark:text-stone-200"
          >
            My cards
          </Link>
        </div>
      </section>

      {/* Demo card mock */}
      <section aria-label="Example card" className="mx-auto max-w-3xl px-4">
        <div className={cx('rounded-3xl p-4 sm:p-6', theme.page, 'shadow-xl ring-1 ring-stone-900/5')}>
          <div className={cx('rounded-2xl px-6 py-8 text-center', theme.header)}>
            <div className="text-4xl">👋</div>
            <h2 className={cx('mt-2 text-3xl font-bold', theme.title)}>Farewell, Sara — we'll miss you!</h2>
            <p className={cx('mt-1', theme.subtitle)}>for @sara</p>
          </div>
          <div className={cx('mx-auto mt-4 w-fit rounded-2xl px-5 py-2.5 font-display text-lg font-bold', theme.banner)}>
            4 friends signed · chipped in 40 UCT
          </div>
          <div className="mt-4 columns-1 gap-3 sm:columns-2 [&>*]:mb-3">
            {demoNotes.map((n, i) => (
              <figure key={i} className={cx('break-inside-avoid p-4', theme.note)}>
                <div className="flex items-start justify-between gap-2">
                  <figcaption className={cx('font-display font-semibold', theme.noteName)}>
                    {n.emoji} {n.name}
                  </figcaption>
                  {n.amount && (
                    <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', theme.badge)}>
                      ✓ {n.amount}
                    </span>
                  )}
                </div>
                <blockquote className="mt-1.5 text-sm">{n.note}</blockquote>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="font-display text-center text-3xl font-bold">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            ['1. Start a card', 'Pick who it\'s for, the occasion, and a look. You get one link to share.', '💌'],
            ['2. Friends sign it', 'Each friend writes a note and chips in test tokens — sent wallet-to-wallet, straight to the recipient.', '✍️'],
            ['3. They open it', 'The recipient gets a DM with the link: every note, plus everything friends gave — already in their wallet.', '🥂'],
          ].map(([title, body, emoji]) => (
            <li key={title} className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
              <div className="text-3xl">{emoji}</div>
              <h3 className="font-display mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Architecture statement */}
      <section className="border-y border-stone-200 bg-white px-4 py-14 dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold">This app has no server.</h2>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-300">
            Every card is a private group on the <strong>Unicity network</strong> — the network
            itself is the database. Your wallet is created in your browser and never leaves it.
            And when a friend chips in, tokens move <strong>directly from their wallet to the
            recipient's wallet</strong>, peer-to-peer. No pool, no custodian, no middleman —
            not even us. Anyone can verify every gift by its on-network transfer id.
          </p>
          <div className="mx-auto mt-6 w-fit rounded-xl bg-stone-100 px-4 py-3 text-left font-mono text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            <div>browser wallet ⇆ Nostr relay (the card) ⇆ testnet2 gateway (the money)</div>
            <div className="mt-1 text-center text-stone-400">— no server anywhere —</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-4xl px-4 py-10 text-center text-sm text-stone-500 dark:text-stone-400">
        <p>
          Built on <a className="underline" href="https://developers.unicity.network/docs" target="_blank" rel="noreferrer">Unicity Sphere</a> (testnet2)
          {' · '}
          <a className="underline" href="https://github.com/unicity-sphere/sphere-sdk" target="_blank" rel="noreferrer">Sphere SDK</a>
          {' · '}
          <span>protocol: each card = one NIP-29 group; card state = signed JSON messages</span>
        </p>
        <p className="mt-2">Testnet tokens only — mint your own, no real value.</p>
      </footer>
    </div>
  );
}

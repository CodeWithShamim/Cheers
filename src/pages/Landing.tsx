import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { cx } from '../components/ui';

const demoNotes = [
  { name: 'Rafi', tint: 'from-fuchsia-500 to-pink-500', note: "Best boss ever. Don't go!", amount: '10' },
  { name: 'Priya', tint: 'from-violet-500 to-indigo-500', note: 'The kitchen will be quieter without your laugh.', amount: '5' },
  { name: 'Tom', tint: 'from-cyan-500 to-sky-500', note: 'To the next adventure!', amount: null },
  { name: 'Ana', tint: 'from-amber-500 to-orange-500', note: 'You taught me everything. Thank you.', amount: '25' },
];

const steps = [
  { icon: 'mail', title: '1. Start a card', body: "Pick who it's for, the occasion, and a look. You get one link to share." },
  { icon: 'pen', title: '2. Friends sign it', body: 'Each friend writes a note and chips in test tokens, sent wallet-to-wallet, straight to the recipient.' },
  { icon: 'gift', title: '3. They open it', body: 'The recipient gets a DM with the link: every note, plus everything friends gave, already in their wallet.' },
] as const;

export default function Landing() {
  return (
    <div>
      {/* ── Hero: content left, live scene right ─────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Colorful web3 backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 top-8 h-72 w-72 animate-blob rounded-full bg-fuchsia-400/40 blur-3xl dark:bg-fuchsia-600/25" />
          <div className="absolute right-0 top-24 h-80 w-80 animate-blob rounded-full bg-cyan-400/40 blur-3xl [animation-delay:-5s] dark:bg-cyan-500/20" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-blob rounded-full bg-amber-400/40 blur-3xl [animation-delay:-9s] dark:bg-amber-500/20" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(120_120_120/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(120_120_120/0.06)_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:gap-8">
          {/* Left: the pitch */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/60 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-fuchsia-700 shadow-sm backdrop-blur dark:border-fuchsia-500/30 dark:bg-white/5 dark:text-fuchsia-300">
              <Icon name="shield" className="h-4 w-4" />
              No server. Wallet-to-wallet. On-chain.
            </span>

            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.05] sm:text-6xl">
              The group card where everyone{' '}
              <span className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent dark:from-fuchsia-400 dark:via-violet-400 dark:to-cyan-300">
                chips in real money
              </span>
            </h1>

            <p className="mt-5 text-lg text-stone-600 dark:text-stone-300">
              Start a card for someone's birthday, farewell, or big win. Friends sign it with a note
              and send tokens straight to the recipient's wallet. They open one page with every
              message and everything friends gave them.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/create"
                className="press inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-7 py-3.5 text-lg font-bold text-white shadow-lg shadow-fuchsia-600/30 hover:from-fuchsia-500 hover:to-violet-500"
              >
                Start a card
                <Icon name="arrowRight" className="h-5 w-5" />
              </Link>
              <Link
                to="/mine"
                className="press inline-flex items-center gap-2 rounded-2xl border border-stone-300 px-7 py-3.5 text-lg font-semibold text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:text-stone-200"
              >
                <Icon name="inbox" className="h-5 w-5" />
                My cards
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              {[
                { icon: 'users', k: 'Everyone', v: 'chips in together' },
                { icon: 'bolt', k: 'Instant', v: 'peer-to-peer gifts' },
                { icon: 'check', k: 'Verifiable', v: 'every gift on-network' },
              ].map((f) => (
                <div key={f.k} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-100 to-cyan-100 text-fuchsia-700 dark:from-fuchsia-500/15 dark:to-cyan-500/15 dark:text-fuchsia-300">
                    <Icon name={f.icon as 'users'} className="h-5 w-5" />
                  </span>
                  <div className="text-sm leading-tight">
                    <dt className="font-semibold">{f.k}</dt>
                    <dd className="text-stone-500 dark:text-stone-400">{f.v}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: floating card scene */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            {/* floating chips */}
            <div className="absolute -left-4 top-10 z-20 hidden animate-float rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-2 dark:border-white/10 dark:bg-stone-900/80">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Icon name="check" className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+10 UCT sent</span>
            </div>
            <div className="absolute -right-3 top-1/3 z-20 hidden animate-float items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 shadow-xl backdrop-blur [animation-delay:-2.5s] sm:flex dark:border-white/10 dark:bg-stone-900/80">
              <Icon name="coin" className="h-7 w-7 text-amber-500" />
              <span className="text-sm font-bold">wallet-to-wallet</span>
            </div>
            <Icon
              name="sparkles"
              className="absolute -right-2 -top-3 z-20 h-9 w-9 animate-float-slow text-fuchsia-500 drop-shadow"
            />

            {/* the card */}
            <div className="animate-float-slow rounded-[2rem] bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-500 p-[2px] shadow-2xl shadow-violet-600/25">
              <div className="rounded-[calc(2rem-2px)] bg-white/95 p-5 backdrop-blur dark:bg-stone-950/90">
                <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-500 px-6 py-7 text-center text-white shadow-lg">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <Icon name="suitcase" className="h-7 w-7" />
                  </span>
                  <h2 className="font-display mt-3 text-2xl font-bold">Farewell, Sara</h2>
                  <p className="text-sm text-white/80">for @sara</p>
                </div>

                <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-2xl bg-stone-100 px-4 py-2 text-sm font-bold dark:bg-stone-800">
                  <Icon name="users" className="h-4 w-4 text-violet-500" />
                  4 friends signed
                  <span className="text-stone-400">·</span>
                  <Icon name="coin" className="h-4 w-4 text-amber-500" />
                  40 UCT
                </div>

                <div className="mt-4 space-y-2.5">
                  {demoNotes.slice(0, 3).map((n) => (
                    <div
                      key={n.name}
                      className="flex items-start gap-3 rounded-xl border border-stone-200/70 bg-white/70 p-3 dark:border-stone-800 dark:bg-stone-900/60"
                    >
                      <span
                        className={cx(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white',
                          n.tint,
                        )}
                      >
                        {n.name[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-semibold">{n.name}</span>
                          {n.amount && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              <Icon name="check" className="h-3 w-3" />
                              {n.amount} UCT
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-stone-500 dark:text-stone-400">{n.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="font-display text-center text-3xl font-bold">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.title}
              className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white shadow-md shadow-violet-500/25">
                <Icon name={s.icon} className="h-6 w-6" />
              </span>
              <h3 className="font-display mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Architecture statement ───────────────────────────────────── */}
      <section className="border-y border-stone-200 bg-white px-4 py-14 dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold">This app has no server.</h2>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-300">
            Every card is a private group on the <strong>Unicity network</strong>: the network
            itself is the database. Your wallet is created in your browser and never leaves it.
            And when a friend chips in, tokens move <strong>directly from their wallet to the
            recipient's wallet</strong>, peer-to-peer. No pool, no custodian, no middleman, not
            even us. Anyone can verify every gift by its on-network transfer id.
          </p>
          <div className="mx-auto mt-6 flex w-fit flex-wrap items-center justify-center gap-3 rounded-xl bg-stone-100 px-4 py-3 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            <span className="inline-flex items-center gap-1.5"><Icon name="wallet" className="h-4 w-4" /> browser wallet</span>
            <Icon name="link" className="h-4 w-4 text-stone-400" />
            <span className="inline-flex items-center gap-1.5"><Icon name="mail" className="h-4 w-4" /> Nostr relay</span>
            <Icon name="link" className="h-4 w-4 text-stone-400" />
            <span className="inline-flex items-center gap-1.5"><Icon name="coin" className="h-4 w-4" /> testnet2 gateway</span>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-4xl px-4 py-10 text-center text-sm text-stone-500 dark:text-stone-400">
        <p>
          Built on{' '}
          <a className="underline" href="https://developers.unicity.network/docs" target="_blank" rel="noreferrer">
            Unicity Sphere
          </a>{' '}
          (testnet2)
          {' · '}
          <a className="underline" href="https://github.com/unicity-sphere/sphere-sdk" target="_blank" rel="noreferrer">
            Sphere SDK
          </a>
          {' · '}
          <span>protocol: each card = one NIP-29 group; card state = signed JSON messages</span>
        </p>
        <p className="mt-2">Testnet tokens only. Mint your own, no real value.</p>
      </footer>
    </div>
  );
}

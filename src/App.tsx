import type { ReactNode } from 'react';
import { Link, RouterProvider, useLocation } from 'react-router-dom';
import { WalletWidget } from './components/WalletWidget';
import { Icon } from './components/Icon';
import { router } from './router';

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  // The card page paints its own full-bleed themed background.
  const onCard = location.pathname.startsWith('/c');

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={
          onCard
            ? 'absolute inset-x-0 top-0 z-30'
            : 'sticky top-0 z-30 border-b border-stone-200/70 bg-[#faf8f4]/85 backdrop-blur dark:border-stone-800/70 dark:bg-[#171412]/85'
        }
      >
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="press flex items-center gap-2 font-display text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-violet-600 text-white shadow-sm">
              <Icon name="cheers" className="h-5 w-5" />
            </span>
            Cheers
          </Link>
          <div className="flex items-center gap-2 text-sm">
            {!onCard && (
              <>
                <Link to="/create" className="press hidden rounded-full px-3 py-1.5 font-semibold text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800 sm:block">
                  Create
                </Link>
                <Link to="/mine" className="press hidden rounded-full px-3 py-1.5 font-semibold text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800 sm:block">
                  My cards
                </Link>
              </>
            )}
            <WalletWidget />
          </div>
        </nav>
      </header>
      <main className={onCard ? 'flex-1' : 'flex-1'}>{children}</main>
    </div>
  );
}

export default function App() {
  return <RouterProvider router={router} />;
}

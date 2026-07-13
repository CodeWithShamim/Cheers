import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link, RouterProvider, useLocation } from 'react-router-dom';
import { WalletWidget } from './components/WalletWidget';
import { Icon } from './components/Icon';
import { router } from './router';

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  // The card page paints its own full-bleed themed background.
  // Match only /c and /c/* — not /create, which also starts with "/c".
  const onCard = location.pathname === '/c' || location.pathname.startsWith('/c/');
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever we navigate to a new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
            {!onCard && (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="press flex h-9 w-9 items-center justify-center rounded-full text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800 sm:hidden"
              >
                <Icon name={menuOpen ? 'close' : 'menu'} className="h-5 w-5" />
              </button>
            )}
          </div>
        </nav>

        {/* Mobile-only dropdown menu. */}
        {!onCard && menuOpen && (
          <div className="border-t border-stone-200/70 dark:border-stone-800/70 sm:hidden">
            <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3 text-sm">
              <Link to="/create" className="press flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-stone-700 hover:bg-stone-200/60 dark:text-stone-200 dark:hover:bg-stone-800">
                <Icon name="pen" className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                Create
              </Link>
              <Link to="/mine" className="press flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-stone-700 hover:bg-stone-200/60 dark:text-stone-200 dark:hover:bg-stone-800">
                <Icon name="inbox" className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                My cards
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return <RouterProvider router={router} />;
}

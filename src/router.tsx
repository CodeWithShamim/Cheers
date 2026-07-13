import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Shell } from './App';
import { Spinner } from './components/ui';

// Code-split every route; only Landing is in the main chunk path anyway.
const Landing = lazy(() => import('./pages/Landing'));
const Create = lazy(() => import('./pages/Create'));
const CardPage = lazy(() => import('./pages/Card'));
const MyCards = lazy(() => import('./pages/MyCards'));
const WalletPage = lazy(() => import('./pages/Wallet'));

function Fallback() {
  return (
    <div className="flex justify-center py-24 text-stone-400" role="status" aria-label="Loading">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function Layout() {
  return (
    <Shell>
      <Suspense fallback={<Fallback />}>
        <Outlet />
      </Suspense>
    </Shell>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/create', element: <Create /> },
      { path: '/c', element: <CardPage /> },
      { path: '/c/*', element: <CardPage /> },
      { path: '/mine', element: <MyCards /> },
      { path: '/wallet', element: <WalletPage /> },
      { path: '*', element: <Landing /> },
    ],
  },
]);

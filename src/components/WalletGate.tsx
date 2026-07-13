/**
 * Wraps any page that needs the wallet: initializes the Sphere client on
 * mount, shows progress/error states, and enforces the first-run mnemonic
 * backup before letting the user continue.
 */
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { retryPendingSignatures } from '../sphere/cards';
import { useWallet } from '../store';
import { MnemonicBackup } from './MnemonicBackup';
import { ErrorNote, Spinner } from './ui';

let retriedPending = false;

export function WalletGate({ children }: { children: ReactNode }) {
  const { status, error, needsBackup, init, confirmBackup } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    // One shot per session: re-post any signature whose payment already
    // happened but whose card.sign post failed (never re-pays).
    if (status === 'ready' && !retriedPending) {
      retriedPending = true;
      void retryPendingSignatures().catch(() => {
        retriedPending = false; // allow another attempt next mount
      });
    }
  }, [status]);

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorNote retry={() => window.location.reload()}>
          Your wallet couldn't start: {error}
        </ErrorNote>
      </div>
    );
  }

  if (status !== 'ready') {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-24 text-stone-500" role="status">
        <Spinner className="h-8 w-8" />
        <p>Starting your in-browser wallet…</p>
        <p className="text-xs text-stone-400">Keys are generated locally and never leave this device.</p>
      </div>
    );
  }

  if (needsBackup) {
    return (
      <div className="px-4 py-10">
        <MnemonicBackup
          onConfirmed={confirmBackup}
          onRestoreInstead={() => {
            confirmBackup(); // the generated wallet is being replaced anyway
            navigate('/wallet?restore=1');
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}

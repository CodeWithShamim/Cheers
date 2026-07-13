import { Link } from 'react-router-dom';
import { formatUctWithSymbol } from '../lib/format';
import { Icon } from './Icon';
import { useWallet } from '../store';

/**
 * Small header widget. Deliberately does NOT initialize the wallet - it only
 * reflects state once some page has (keeps the landing page SDK-free).
 */
export function WalletWidget() {
  const { status, nametag, uctBalance } = useWallet();

  return (
    <Link
      to="/wallet"
      className="press flex items-center gap-2 rounded-full border border-stone-300 px-3.5 py-1.5 text-sm font-semibold text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:text-stone-200"
    >
      <Icon name="wallet" className="h-4 w-4 text-stone-500 dark:text-stone-400" />
      {status === 'ready' ? (
        <>
          <span className="max-w-[10rem] truncate">{nametag ? `@${nametag}` : 'Wallet'}</span>
          <span className="text-stone-400">·</span>
          <span className="tabular-nums">{formatUctWithSymbol(uctBalance)}</span>
        </>
      ) : (
        <span>Wallet</span>
      )}
    </Link>
  );
}

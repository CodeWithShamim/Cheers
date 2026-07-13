/**
 * Every SDK failure the app can hit, mapped to a human message.
 */
import { isSphereError } from '@unicitylabs/sphere-sdk';

export function toHumanError(err: unknown): string {
  if (isSphereError(err)) {
    switch (err.code) {
      case 'INVALID_RECIPIENT':
        return "This nametag doesn't exist on the network yet. Ask them to register it in their wallet first.";
      case 'INSUFFICIENT_BALANCE':
      case 'SEND_INSUFFICIENT_BALANCE':
        return 'Not enough test tokens for this gift. Tap “Get test tokens” to mint some.';
      case 'CERTIFICATION_UNCONFIRMED':
        return 'Your gift was sent but the network confirmation is still settling. Do NOT retry the payment — it will complete on its own.';
      case 'AGGREGATOR_ERROR':
        return 'The testnet2 gateway rejected the request. Check that VITE_UNICITY_API_KEY is set (see .env.example) and try again.';
      case 'TRANSPORT_ERROR':
        return 'Lost connection to the Unicity relay. Reconnecting…';
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return 'The network is not responding right now. Check your connection and try again.';
      case 'RATE_LIMITED':
        return 'The network is rate-limiting requests. Wait a few seconds and try again.';
      case 'INVALID_AMOUNT':
        return "That amount isn't valid. Use a plain number like 5 or 1.5.";
      default:
        return `Something went wrong on the network (${err.code}). Please try again.`;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Something unexpected went wrong. Please try again.';
}

/** True when a caught send() error means "may already be paid — never re-pay". */
export function isPaymentIndeterminate(err: unknown): boolean {
  return isSphereError(err) && err.code === 'CERTIFICATION_UNCONFIRMED';
}

export function isInsufficientBalance(err: unknown): boolean {
  return (
    isSphereError(err) &&
    (err.code === 'INSUFFICIENT_BALANCE' || err.code === 'SEND_INSUFFICIENT_BALANCE')
  );
}

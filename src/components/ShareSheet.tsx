import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button, CopyButton } from './ui';

export function ShareSheet({ url, title }: { url: string; title: string }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="space-y-4">
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={url}
          aria-label="Card link"
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 font-mono text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
        />
        <CopyButton text={url} label="Copy link" className="shrink-0" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {canNativeShare && (
          <Button
            onClick={() =>
              navigator.share({ title, text: `Sign this card: ${title}`, url }).catch(() => undefined)
            }
          >
            Share…
          </Button>
        )}
      </div>
      {qr && (
        <div className="inline-block rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700">
          <img src={qr} alt={`QR code linking to the card “${title}”`} width={180} height={180} />
        </div>
      )}
      <p className="text-xs text-stone-500 dark:text-stone-400">
        The link contains the card's private invite in the URL <em>hash</em> - it never hits a
        server log. Anyone with the link can read and sign the card.
      </p>
    </div>
  );
}

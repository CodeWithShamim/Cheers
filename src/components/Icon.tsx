/**
 * Shared solid icon set. One consistent visual language across the whole app
 * (replaces the ad-hoc emoji that used to stand in for icons). All icons are
 * 24x24, fill=currentColor, so they inherit text color and size via className.
 */
import type { SVGProps, ReactNode } from 'react';

export type IconName =
  | 'cheers'
  | 'wallet'
  | 'check'
  | 'close'
  | 'refresh'
  | 'eye'
  | 'gift'
  | 'inbox'
  | 'heart'
  | 'heartBroken'
  | 'pen'
  | 'mail'
  | 'send'
  | 'users'
  | 'sparkles'
  | 'star'
  | 'shield'
  | 'arrowRight'
  | 'link'
  | 'bolt'
  | 'coin'
  // occasions
  | 'cake'
  | 'suitcase'
  | 'trophy'
  | 'flower'
  // themes
  | 'sun'
  | 'moon'
  | 'leaf';

const PATHS: Record<IconName, ReactNode> = {
  cheers: (
    <path d="M5 3h14l-1.2 5.1A6 6 0 0 1 13 12.9V19h3.5a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2H11v-6.1A6 6 0 0 1 6.2 8.1L5 3zm2.1 2 .7 2.9h8.4L16.9 5H7.1z" />
  ),
  wallet: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 5a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H5a1 1 0 0 0 0 2h15a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6a2 2 0 0 1 2-1zm13 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
    />
  ),
  check: <path d="M9.55 17.6 4.4 12.45l1.4-1.42 3.75 3.75L18 5.35l1.4 1.4z" />,
  close: (
    <path d="M6.4 4.99 4.99 6.4 10.59 12l-5.6 5.6 1.41 1.41L12 13.41l5.6 5.6 1.41-1.41L13.41 12l5.6-5.6-1.41-1.41L12 10.59z" />
  ),
  refresh: <path d="M12 6V3L7.5 7.5 12 12V8.5a3.5 3.5 0 1 1-3.5 3.5H6a6 6 0 1 0 6-6z" />,
  eye: (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 5C5.6 5 1.7 11.2 1.5 11.5a1 1 0 0 0 0 1C1.7 12.8 5.6 19 12 19s10.3-6.2 10.5-6.5a1 1 0 0 0 0-1C22.3 11.2 18.4 5 12 5zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
      />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  gift: (
    <>
      <path d="M20 7h-1.6A3 3 0 0 0 13 3.4a4.6 4.6 0 0 0-1 .9 4.6 4.6 0 0 0-1-.9A3 3 0 0 0 5.6 7H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h7V9h2v2h7a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM8.5 7a1 1 0 1 1 1-1v1H8.5zm7 0h-1v-1a1 1 0 1 1 1 1z" />
      <path d="M4 12.5V20a1 1 0 0 0 1 1h6v-8.5H4zM13 21h6a1 1 0 0 0 1-1v-7.5h-7V21z" />
    </>
  ),
  inbox: (
    <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 12h-4a3 3 0 0 1-6 0H5V5h14v10z" />
  ),
  heart: (
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
  ),
  heartBroken: (
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09l-2.2 3.16 3 2.25-3 3 1.8 1.9-1.6 6zm1.5-1.62C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3c-.6 0-1.19.1-1.74.28l-1.86 2.66 3 2.25-3.4 3.4 1.8 1.9z" />
  ),
  pen: (
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  ),
  mail: (
    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
  ),
  send: <path d="M2 21 23 12 2 3l.01 7L17 12 2.01 14z" />,
  users: (
    <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  ),
  sparkles: (
    <>
      <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9z" />
      <path d="M18 13l.75 2.05L21 16l-2.25.95L18 19l-.75-2.05L15 16l2.25-.95z" />
      <path d="M5.5 14l.6 1.6L7.7 16l-1.6.6L5.5 18l-.6-1.4L3.3 16l1.6-.4z" />
    </>
  ),
  star: <path d="M12 3l2.6 6.1L21 9.6l-4.9 4.2L17.7 21 12 17.3 6.3 21l1.6-7.2L3 9.6l6.4-.5z" />,
  shield: <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />,
  arrowRight: <path d="M4 11v2h12l-5.5 5.5L12 20l8-8-8-8-1.5 1.5L16 11z" />,
  link: (
    <path d="M3.9 12A3.1 3.1 0 0 1 7 8.9h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z" />
  ),
  bolt: <path d="M13 2 3 14h7l-1 8 10-12h-7z" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" d="M12 7v10M14.5 9.2a2.6 2.6 0 0 0-2.5-1.4c-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2a2.6 2.6 0 0 1-2.5-1.4" />
    </>
  ),
  cake: (
    <>
      <path d="M12 1s-1.6 1.6-1.6 2.6A1.6 1.6 0 0 0 12 5.2a1.6 1.6 0 0 0 1.6-1.6C13.6 2.6 12 1 12 1z" />
      <path d="M11 6h2v2h4a2 2 0 0 1 2 2v2H5v-2a2 2 0 0 1 2-2h4V6z" />
      <path d="M5 13.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6.5a3 3 0 0 1-3.5.4 3 3 0 0 1-3.5 0 3 3 0 0 1-3.5 0A3 3 0 0 1 5 13.5z" />
    </>
  ),
  suitcase: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 4a2 2 0 0 0-2 2v1H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a2 2 0 0 0-2-2H9zm6 3V6H9v1h6z"
    />
  ),
  trophy: (
    <path d="M18 4V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1H3v3a4 4 0 0 0 4 4 5 5 0 0 0 4 3.9V18H8v2h8v-2h-3v-3.1A5 5 0 0 0 17 11a4 4 0 0 0 4-4V4h-3zM6 9a2 2 0 0 1-1-1.73V6h1v3zm13-1.73A2 2 0 0 1 18 9V6h1v1.27z" />
  ),
  flower: (
    <>
      <path d="M11 13h2v8h-2z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2a2.8 2.8 0 0 1 2.76 2.35A2.8 2.8 0 0 1 18.5 8.1a2.8 2.8 0 0 1 .01 4.05A2.8 2.8 0 0 1 15 15.9a2.8 2.8 0 0 1-6 0A2.8 2.8 0 0 1 5.48 12.16 2.8 2.8 0 0 1 5.5 8.1a2.8 2.8 0 0 1 3.74-3.75A2.8 2.8 0 0 1 12 2zm0 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"
      />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 1.5l1.4 2.8h-2.8zM12 22.5l1.4-2.8h-2.8zM1.5 12l2.8 1.4v-2.8zM22.5 12l-2.8 1.4v-2.8zM4.2 4.2l3 .9-2.1 2.1zM19.8 4.2l-.9 3-2.1-2.1zM4.2 19.8l.9-3 2.1 2.1zM19.8 19.8l-3-.9 2.1-2.1z" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  leaf: (
    <path d="M5 21c-.5-4 1-8 4-11 2.5-2.5 6-3.4 9-3.4-.4 3-1.4 6.4-3.9 8.9-2.4 2.4-5.5 3.4-8.1 3.6 1-2.6 3-4.6 5.6-6-3 1-5.2 3-6.4 6L5 21z" />
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = 'h-5 w-5', ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

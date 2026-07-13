/**
 * App-level wallet state (zustand). The Sphere client itself stays in
 * src/sphere/client.ts — this store mirrors just what the UI renders.
 */
import { create } from 'zustand';
import type { Asset } from '@unicitylabs/sphere-sdk';
import { getSphere, getSphereInit } from './sphere/client';
import { confirmBackup as persistBackupConfirm, isBackupConfirmed } from './lib/backup';

export type WalletStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface WalletState {
  status: WalletStatus;
  error: string | null;
  /** L3 DIRECT address (primary). */
  address: string | null;
  chainPubkey: string | null;
  nametag: string | null;
  /** True until the user confirms they saved the mnemonic. */
  needsBackup: boolean;
  assets: Asset[];
  uctBalance: bigint;
  init: () => Promise<void>;
  refreshAssets: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
  confirmBackup: () => void;
}

export const useWallet = create<WalletState>((set, get) => ({
  status: 'idle',
  error: null,
  address: null,
  chainPubkey: null,
  nametag: null,
  needsBackup: false,
  assets: [],
  uctBalance: 0n,

  init: async () => {
    if (get().status === 'initializing' || get().status === 'ready') return;
    set({ status: 'initializing', error: null });
    try {
      const { sphere } = await getSphereInit();
      sphere.on('identity:changed', () => void get().refreshIdentity());
      sphere.on('nametag:recovered', () => void get().refreshIdentity());
      set({
        status: 'ready',
        address: sphere.identity?.directAddress ?? null,
        chainPubkey: sphere.identity?.chainPubkey ?? null,
        nametag: sphere.identity?.nametag ?? null,
        needsBackup: !isBackupConfirmed(),
      });
      void get().refreshAssets();
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Wallet failed to start.',
      });
    }
  },

  refreshAssets: async () => {
    try {
      const sphere = await getSphere();
      const assets = await sphere.payments.getAssets();
      const uct = assets.find((a) => a.symbol === 'UCT');
      set({ assets, uctBalance: uct ? BigInt(uct.totalAmount) : 0n });
    } catch {
      // balance refresh is best-effort; UI keeps last known values
    }
  },

  refreshIdentity: async () => {
    const sphere = await getSphere();
    set({
      address: sphere.identity?.directAddress ?? null,
      chainPubkey: sphere.identity?.chainPubkey ?? null,
      nametag: sphere.identity?.nametag ?? null,
    });
  },

  confirmBackup: () => {
    persistBackupConfirm();
    set({ needsBackup: false });
  },
}));

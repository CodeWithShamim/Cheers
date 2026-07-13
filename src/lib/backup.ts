/** First-run mnemonic-backup confirmation flag. Pure/SDK-free. */

const BACKUP_CONFIRMED_KEY = 'cheers_backup_confirmed';

export function isBackupConfirmed(): boolean {
  return localStorage.getItem(BACKUP_CONFIRMED_KEY) === 'true';
}

export function confirmBackup(): void {
  localStorage.setItem(BACKUP_CONFIRMED_KEY, 'true');
}

export function resetBackupConfirmation(): void {
  localStorage.removeItem(BACKUP_CONFIRMED_KEY);
}

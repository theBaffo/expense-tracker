export function todayISO(): string {
  return dateToISO(new Date());
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export function fmtShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Returns "YYYY-MM-15" of the current month. */
export function defaultSettlementDate(): string {
  const now = new Date();
  return dateToISO(new Date(now.getFullYear(), now.getMonth(), 15));
}

export function formatSectionDate(iso: string): string {
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';

  const [y, m, d] = iso.split('-').map(Number);

  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

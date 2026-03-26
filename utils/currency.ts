export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CHF: 'Fr',
};

export function currencySymbol(code: string | null | undefined): string {
  return CURRENCY_SYMBOL[code ?? 'EUR'] ?? code ?? '€';
}

export function fmtAmount(amount: number, currency?: string | null): string {
  return `${currencySymbol(currency)}${Math.abs(amount).toFixed(2)}`;
}

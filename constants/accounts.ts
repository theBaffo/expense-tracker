export const ACCOUNT_TYPE_META = [
  { value: 'current' as const, label: 'Current', icon: 'bank' },
  { value: 'credit_card' as const, label: 'Credit Card', icon: 'credit-card-outline' },
  { value: 'savings' as const, label: 'Savings', icon: 'piggy-bank-outline' },
  { value: 'cash' as const, label: 'Cash', icon: 'cash' },
];

export const DEFAULT_ACCOUNTS = [
  {
    name: 'Cash',
    type: 'cash' as const,
    currency: 'EUR',
    colorHex: '#43A047',
    currentBalance: 0,
  },
  {
    name: 'Main Account',
    type: 'current' as const,
    currency: 'EUR',
    colorHex: '#1E88E5',
    currentBalance: 0,
  },
  {
    name: 'Credit Card',
    type: 'credit_card' as const,
    currency: 'EUR',
    colorHex: '#E53935',
    currentBalance: 0,
  },
];

export const PRESET_COLORS = [
  '#E53935', // Red
  '#FB8C00', // Orange
  '#FDD835', // Yellow
  '#43A047', // Green
  '#1E88E5', // Blue
  '#5E35B1', // Deep Purple
  '#D81B60', // Pink
  '#00ACC1', // Cyan
  '#6D4C41', // Brown
  '#546E7A', // Blue Grey
] as const;

export const PRESET_ICONS = [
  'food-fork-drink',
  'car',
  'home',
  'movie-open-outline',
  'heart-pulse',
  'shopping',
  'gamepad-variant-outline',
  'dumbbell',
  'briefcase-outline',
  'gift-outline',
  'airplane',
  'school-outline',
  'music-note',
  'coffee',
  'medical-bag',
  'paw',
  'book-open-variant',
  'cellphone',
  'lightning-bolt',
  'tag-outline',
] as const;

export const DEFAULT_CATEGORIES: { name: string; icon: string; colorHex: string }[] = [
  { name: 'Food & Drink', icon: 'food-fork-drink', colorHex: '#FB8C00' },
  { name: 'Transport', icon: 'car', colorHex: '#1E88E5' },
  { name: 'Housing', icon: 'home', colorHex: '#43A047' },
  { name: 'Entertainment', icon: 'movie-open-outline', colorHex: '#5E35B1' },
  { name: 'Health', icon: 'heart-pulse', colorHex: '#E53935' },
  { name: 'Shopping', icon: 'shopping', colorHex: '#D81B60' },
];

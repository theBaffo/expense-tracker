import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// WAL mode is enabled by default in expo-sqlite v15
const expo = openDatabaseSync('expense_tracker.db', {
  enableChangeListener: true,
});

export const db = drizzle(expo, { schema });

export type Database = typeof db;

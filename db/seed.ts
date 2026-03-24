import { db } from '@/db';
import { accounts, categories } from '@/db/schema';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { DEFAULT_ACCOUNTS } from '@/constants/accounts';

export async function seedDefaults() {
  const [existingCategories, existingAccounts] = await Promise.all([
    db.select({ id: categories.id }).from(categories).limit(1),
    db.select({ id: accounts.id }).from(accounts).limit(1),
  ]);

  await Promise.all([
    existingCategories.length === 0
      ? db.insert(categories).values(DEFAULT_CATEGORIES)
      : Promise.resolve(),
    existingAccounts.length === 0
      ? db.insert(accounts).values(DEFAULT_ACCOUNTS)
      : Promise.resolve(),
  ]);
}

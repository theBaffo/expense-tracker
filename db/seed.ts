import { db } from '@/db';
import { accounts, categories } from '@/db/schema';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { DEFAULT_ACCOUNTS } from '@/constants/accounts';

export async function seedDefaults() {
  const [existingCategories, existingAccounts] = await Promise.all([
    db.select({ id: categories.id }).from(categories).limit(1),
    db.select({ id: accounts.id }).from(accounts).limit(1),
  ]);

  if (existingCategories.length === 0) {
    await db.insert(categories).values(DEFAULT_CATEGORIES);
  }

  if (existingAccounts.length === 0) {
    // Insert non-credit accounts first, then wire up the credit card's connectedAccountId
    const nonCreditDefaults = DEFAULT_ACCOUNTS.filter((a) => a.type !== 'credit_card');
    const creditCardDefaults = DEFAULT_ACCOUNTS.filter((a) => a.type === 'credit_card');

    const inserted = await db
      .insert(accounts)
      .values(nonCreditDefaults)
      .returning({ id: accounts.id, type: accounts.type });
    const mainAccount = inserted.find((a) => a.type === 'current');

    for (const card of creditCardDefaults) {
      await db.insert(accounts).values({
        ...card,
        connectedAccountId: mainAccount?.id ?? null,
      });
    }
  }
}

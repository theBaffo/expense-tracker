import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq, or } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, transactions, settlements } from '@/db/schema';
import type { NewAccount } from '@/db/schema';

export function useAccounts() {
  const { data } = useLiveQuery(db.select().from(accounts).orderBy(accounts.name));

  async function addAccount(values: Omit<NewAccount, 'id' | 'createdAt'>) {
    await db.insert(accounts).values(values);
  }

  async function updateAccount(id: number, values: Partial<Omit<NewAccount, 'id' | 'createdAt'>>) {
    await db.update(accounts).set(values).where(eq(accounts.id, id));
  }

  async function deleteAccount(id: number) {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async function accountHasActivity(id: number): Promise<boolean> {
    const txRows = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.accountId, id))
      .limit(1);
    if (txRows.length > 0) return true;

    const stlRows = await db
      .select({ id: settlements.id })
      .from(settlements)
      .where(or(eq(settlements.fromAccountId, id), eq(settlements.toAccountId, id)))
      .limit(1);
    return stlRows.length > 0;
  }

  return {
    accounts: data ?? [],
    addAccount,
    updateAccount,
    deleteAccount,
    accountHasActivity,
  };
}

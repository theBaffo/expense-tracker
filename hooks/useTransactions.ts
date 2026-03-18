import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, categories, transactions } from '@/db/schema';
import type { NewTransaction } from '@/db/schema';

export function useTransactions() {
  const { data } = useLiveQuery(
    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        description: transactions.description,
        transactionDate: transactions.transactionDate,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        accountId: transactions.accountId,
        categoryId: transactions.categoryId,
        accountName: accounts.name,
        accountCurrency: accounts.currency,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColorHex: categories.colorHex,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt)),
  );

  async function addTransaction(values: Omit<NewTransaction, 'id' | 'createdAt'>) {
    await db.insert(transactions).values(values);
  }

  async function updateTransaction(
    id: number,
    values: Partial<Omit<NewTransaction, 'id' | 'createdAt'>>,
  ) {
    await db.update(transactions).set(values).where(eq(transactions.id, id));
  }

  async function deleteTransaction(id: number) {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  return {
    transactions: data ?? [],
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export type TransactionRow = ReturnType<typeof useTransactions>['transactions'][number];

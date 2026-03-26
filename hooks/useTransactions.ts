import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, categories, transactions } from '@/db/schema';
import type { NewTransaction } from '@/db/schema';

function findLatestTransaction<T extends { createdAt: string }>(rows: T[]): T | null {
  return rows.reduce<T | null>(
    (prev, tx) => (!prev || tx.createdAt > prev.createdAt ? tx : prev),
    null,
  );
}

export function useTransactions(month?: string) {
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
      .orderBy(
        desc(transactions.transactionDate),
        // Income first, then expenses
        sql`CASE WHEN ${transactions.amount} > 0 THEN 0 ELSE 1 END`,
        // Amount desc (abs for expenses)
        desc(sql`abs(${transactions.amount})`),
      ),
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

  const allTransactions = data ?? [];

  const currentMonth = new Date().toISOString().slice(0, 7);
  const viewMonth = month ?? currentMonth;

  const monthSet = new Set<string>([currentMonth]);
  for (const tx of allTransactions) monthSet.add(tx.transactionDate.slice(0, 7));
  const availableMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

  return {
    transactions: allTransactions.filter((tx) => tx.transactionDate.startsWith(viewMonth)),
    availableMonths,
    latestTransaction: findLatestTransaction(allTransactions),
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export type TransactionRow = ReturnType<typeof useTransactions>['transactions'][number];

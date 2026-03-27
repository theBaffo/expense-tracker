import { useMemo } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, categories, transactions } from '@/db/schema';
import type { NewTransaction } from '@/db/schema';
import { todayISO } from '@/utils/date';

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
        transferPairId: transactions.transferPairId,
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
        sql`CASE WHEN ${transactions.transferPairId} IS NOT NULL THEN 0 ELSE 1 END`,
        sql`CASE WHEN ${transactions.amount} > 0 THEN 0 ELSE 1 END`,
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

  async function transferBetweenAccounts(
    fromAccountId: number,
    fromAccountName: string,
    toAccountId: number,
    toAccountName: string,
    amount: number,
  ) {
    const date = todayISO();
    await db.transaction(async (tx) => {
      // Insert the source (negative) leg first
      await tx.insert(transactions).values({
        accountId: fromAccountId,
        amount: -amount,
        description: `Transfer to ${toAccountName}`,
        transactionDate: date,
        categoryId: null,
        notes: null,
        transferPairId: null,
      });

      // Get its ID (safe inside a transaction — no concurrent writes on SQLite)
      const [{ sourceId }] = await tx
        .select({ sourceId: transactions.id })
        .from(transactions)
        .orderBy(desc(transactions.id))
        .limit(1);

      // Insert the destination (positive) leg, linked to sourceId
      await tx.insert(transactions).values({
        accountId: toAccountId,
        amount,
        description: `Transfer from ${fromAccountName}`,
        transactionDate: date,
        categoryId: null,
        notes: null,
        transferPairId: sourceId,
      });

      // Update the source leg to share the same pairId
      await tx
        .update(transactions)
        .set({ transferPairId: sourceId })
        .where(eq(transactions.id, sourceId));
    });
  }

  const allTransactions = useMemo(() => data ?? [], [data]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const viewMonth = month ?? currentMonth;

  const monthSet = new Set<string>([currentMonth]);
  for (const tx of allTransactions) monthSet.add(tx.transactionDate.slice(0, 7));
  const availableMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

  const transactionsCurrentMonth = useMemo(
    () => allTransactions.filter((tx) => tx.transactionDate.startsWith(viewMonth)),
    [allTransactions, viewMonth],
  );

  return {
    transactionsCurrentMonth,
    transactions: allTransactions,
    availableMonths,
    latestTransaction: findLatestTransaction(allTransactions),
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transferBetweenAccounts,
  };
}

export type TransactionRow = ReturnType<typeof useTransactions>['transactions'][number];

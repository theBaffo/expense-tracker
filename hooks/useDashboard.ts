import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { alias } from 'drizzle-orm/sqlite-core';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, categories, transactions, settlements } from '@/db/schema';
import { dateToISO } from '@/utils/date';

// Stable aliases for the two accounts joins on settlements
const fromAcc = alias(accounts, 'from_acc');
const toAcc = alias(accounts, 'to_acc');

export function useDashboard(month?: string) {
  // ── Raw data queries ───────────────────────────────────────────────────────

  const { data: allAccounts } = useLiveQuery(db.select().from(accounts));

  const { data: allTransactions } = useLiveQuery(
    db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        amount: transactions.amount,
        description: transactions.description,
        transactionDate: transactions.transactionDate,
        accountCurrency: accounts.currency,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColorHex: categories.colorHex,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.transactionDate), desc(transactions.id)),
  );

  const { data: allSettlements } = useLiveQuery(
    db
      .select({
        id: settlements.id,
        fromAccountId: settlements.fromAccountId,
        toAccountId: settlements.toAccountId,
        amount: settlements.amount,
        settlementDate: settlements.settlementDate,
        fromAccountName: fromAcc.name,
        toAccountName: toAcc.name,
        toAccountCurrency: toAcc.currency,
      })
      .from(settlements)
      .leftJoin(fromAcc, eq(settlements.fromAccountId, fromAcc.id))
      .leftJoin(toAcc, eq(settlements.toAccountId, toAcc.id))
      .orderBy(settlements.settlementDate),
  );

  // ── Date constants ─────────────────────────────────────────────────────────

  const today = dateToISO(new Date());
  const currentMonth = today.slice(0, 7); // 'YYYY-MM'
  const viewMonth = month ?? currentMonth;
  const in30Days = dateToISO(new Date(Date.now() + 30 * 86_400_000));

  const txs = allTransactions ?? [];
  const accts = allAccounts ?? [];
  const stls = allSettlements ?? [];

  // ── 1. Available months (all months with transactions + current) ───────────

  const monthSet = new Set<string>([currentMonth]);
  for (const tx of txs) monthSet.add(tx.transactionDate.slice(0, 7));
  const availableMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

  // ── 2. This-month transactions ─────────────────────────────────────────────

  const thisMonthTxs = txs.filter((tx) => tx.transactionDate.startsWith(viewMonth));

  // ── 2. Total spent this month (absolute sum of negative amounts) ───────────

  const totalSpentThisMonth = thisMonthTxs
    .filter((tx) => tx.amount < 0)
    .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  // ── 3. Spending by category this month ────────────────────────────────────

  type CategorySpendingRow = {
    categoryId: number | null;
    categoryName: string | null;
    categoryIcon: string | null;
    categoryColorHex: string | null;
    total: number;
  };

  const catMap = new Map<string, CategorySpendingRow>();
  for (const tx of thisMonthTxs) {
    if (tx.amount >= 0) continue; // expenses only
    const key = tx.categoryId != null ? String(tx.categoryId) : 'uncategorized';
    if (!catMap.has(key)) {
      catMap.set(key, {
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
        categoryIcon: tx.categoryIcon,
        categoryColorHex: tx.categoryColorHex,
        total: 0,
      });
    }
    catMap.get(key)!.total += Math.abs(tx.amount);
  }
  const categorySpending = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

  // ── 4. Account balances as of end of viewMonth ────────────────────────────
  //
  // Transactions use sign convention: negative = expense, positive = income.
  //
  // current / savings / cash:
  //   balance = starting_balance + Σ(transactions) − Σ(outgoing settlements)
  //
  // credit_card:
  //   amount_owed = −Σ(transactions) − Σ(incoming settlements)
  //   (flipping sign so expenses become a positive "owed" figure;
  //    incoming settlements reduce what is owed)
  //
  // Both sums are capped at the end of viewMonth so that navigating to a past
  // month shows the balance as it was then, not the current balance.

  const [vmYear, vmMon] = viewMonth.split('-').map(Number);
  const cutoff = dateToISO(new Date(vmYear, vmMon, 1)); // first day of next month

  const txSumByAccount = new Map<number, number>();
  for (const tx of txs) {
    if (tx.transactionDate >= cutoff) continue;
    txSumByAccount.set(tx.accountId, (txSumByAccount.get(tx.accountId) ?? 0) + tx.amount);
  }

  const outgoingByAccount = new Map<number, number>();
  const incomingByAccount = new Map<number, number>();
  for (const stl of stls) {
    if (stl.settlementDate >= cutoff) continue;
    outgoingByAccount.set(
      stl.fromAccountId,
      (outgoingByAccount.get(stl.fromAccountId) ?? 0) + stl.amount,
    );
    incomingByAccount.set(
      stl.toAccountId,
      (incomingByAccount.get(stl.toAccountId) ?? 0) + stl.amount,
    );
  }

  const accountsWithBalance = accts.map((account) => {
    const txSum = txSumByAccount.get(account.id) ?? 0;
    const outgoing = outgoingByAccount.get(account.id) ?? 0;
    const incoming = incomingByAccount.get(account.id) ?? 0;
    const balance =
      account.type === 'credit_card'
        ? -txSum - incoming
        : account.currentBalance + txSum - outgoing;
    return { ...account, balance };
  });

  // ── 5. Upcoming settlements (today … today + 30 days) ─────────────────────

  const upcomingSettlements = stls.filter(
    (s) => s.settlementDate >= today && s.settlementDate <= in30Days,
  );

  // ── 6. Recent transactions for the viewed month (last 3) ──────────────────

  const recentTransactions = thisMonthTxs.slice(0, 3);

  return {
    viewMonth,
    availableMonths,
    totalSpentThisMonth,
    categorySpending,
    accountsWithBalance,
    upcomingSettlements,
    recentTransactions,
  };
}

export type DashboardCategoryRow = ReturnType<typeof useDashboard>['categorySpending'][number];
export type DashboardAccountRow = ReturnType<typeof useDashboard>['accountsWithBalance'][number];
export type DashboardSettlementRow = ReturnType<typeof useDashboard>['upcomingSettlements'][number];
export type DashboardTxRow = ReturnType<typeof useDashboard>['recentTransactions'][number];

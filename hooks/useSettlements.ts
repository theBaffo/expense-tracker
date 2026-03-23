import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { alias } from 'drizzle-orm/sqlite-core';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, settlements } from '@/db/schema';
import type { NewSettlement } from '@/db/schema';

// Stable aliases for the two accounts joins on settlements
const fromAcc = alias(accounts, 'from_acc');
const toAcc = alias(accounts, 'to_acc');

export function useSettlements() {
  const { data } = useLiveQuery(
    db
      .select({
        id: settlements.id,
        fromAccountId: settlements.fromAccountId,
        toAccountId: settlements.toAccountId,
        amount: settlements.amount,
        settlementDate: settlements.settlementDate,
        notes: settlements.notes,
        createdAt: settlements.createdAt,
        fromAccountName: fromAcc.name,
        fromAccountColorHex: fromAcc.colorHex,
        fromAccountType: fromAcc.type,
        toAccountName: toAcc.name,
        toAccountColorHex: toAcc.colorHex,
        toAccountCurrency: toAcc.currency,
      })
      .from(settlements)
      .leftJoin(fromAcc, eq(settlements.fromAccountId, fromAcc.id))
      .leftJoin(toAcc, eq(settlements.toAccountId, toAcc.id))
      .orderBy(desc(settlements.settlementDate), desc(settlements.id)),
  );

  async function addSettlement(values: Omit<NewSettlement, 'id' | 'createdAt'>) {
    await db.insert(settlements).values(values);
  }

  async function deleteSettlement(id: number) {
    await db.delete(settlements).where(eq(settlements.id, id));
  }

  return {
    settlements: data ?? [],
    addSettlement,
    deleteSettlement,
  };
}

export type SettlementRow = ReturnType<typeof useSettlements>['settlements'][number];

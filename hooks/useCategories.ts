import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import type { NewCategory } from '@/db/schema';

export function useCategories() {
  const { data } = useLiveQuery(
    db.select().from(categories).orderBy(categories.name),
  );

  async function addCategory(values: Omit<NewCategory, 'id'>) {
    await db.insert(categories).values(values);
  }

  async function updateCategory(id: number, values: Partial<Omit<NewCategory, 'id'>>) {
    await db.update(categories).set(values).where(eq(categories.id, id));
  }

  async function deleteCategory(id: number) {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async function categoryHasTransactions(id: number): Promise<boolean> {
    const rows = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.categoryId, id))
      .limit(1);
    return rows.length > 0;
  }

  return {
    categories: data ?? [],
    addCategory,
    updateCategory,
    deleteCategory,
    categoryHasTransactions,
  };
}

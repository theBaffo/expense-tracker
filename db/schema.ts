import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ─── accounts ────────────────────────────────────────────────────────────────

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['current', 'credit_card', 'savings', 'cash'],
  }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  creditLimit: real('credit_limit'), // null for non-credit accounts
  currentBalance: real('current_balance').notNull().default(0),
  colorHex: text('color_hex').notNull().default('#6750A4'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  outgoingSettlements: many(settlements, { relationName: 'fromAccount' }),
  incomingSettlements: many(settlements, { relationName: 'toAccount' }),
}));

// ─── categories ──────────────────────────────────────────────────────────────

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull(), // MaterialCommunityIcons name
  colorHex: text('color_hex').notNull().default('#6750A4'),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

// ─── transactions ─────────────────────────────────────────────────────────────

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  amount: real('amount').notNull(), // negative = expense, positive = income
  description: text('description').notNull(),
  transactionDate: text('transaction_date').notNull(), // ISO 8601 date string
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

// ─── settlements ──────────────────────────────────────────────────────────────

export const settlements = sqliteTable('settlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromAccountId: integer('from_account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  toAccountId: integer('to_account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  settlementDate: text('settlement_date').notNull(), // ISO 8601 date string
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const settlementsRelations = relations(settlements, ({ one }) => ({
  fromAccount: one(accounts, {
    fields: [settlements.fromAccountId],
    references: [accounts.id],
    relationName: 'fromAccount',
  }),
  toAccount: one(accounts, {
    fields: [settlements.toAccountId],
    references: [accounts.id],
    relationName: 'toAccount',
  }),
}));

// ─── Inferred types ──────────────────────────────────────────────────────────

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;

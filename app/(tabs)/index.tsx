import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDashboard } from '@/hooks/useDashboard';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';

// ─── Formatters ───────────────────────────────────────────────────────────────

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CHF: 'Fr',
};

function currencySymbol(code: string | null | undefined): string {
  return CURRENCY_SYMBOL[code ?? 'EUR'] ?? code ?? '€';
}

function fmtAmount(amount: number, currency?: string | null): string {
  return `${currencySymbol(currency)}${Math.abs(amount).toFixed(2)}`;
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function fmtShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const theme = useTheme();
  const {
    thisMonth,
    totalSpentThisMonth,
    categorySpending,
    accountsWithBalance,
    upcomingSettlements,
    recentTransactions,
  } = useDashboard();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="headlineMedium" style={styles.heading}>
          Dashboard
        </Text>

        {/* ── This Month ─────────────────────────────────────────────────── */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {fmtMonth(thisMonth).toUpperCase()}
            </Text>
            <Text variant="titleMedium" style={styles.cardSubtitle}>
              Total Spent
            </Text>
            <Text variant="displaySmall" style={{ color: theme.colors.error }}>
              €{totalSpentThisMonth.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>

        {/* ── Accounts ───────────────────────────────────────────────────── */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Accounts
            </Text>
            {accountsWithBalance.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No accounts yet.
              </Text>
            ) : (
              accountsWithBalance.map((account, index) => {
                const meta = ACCOUNT_TYPE_META.find((m) => m.value === account.type);
                const isCreditCard = account.type === 'credit_card';
                const balanceColor = isCreditCard
                  ? account.balance > 0
                    ? theme.colors.error
                    : theme.colors.onSurface
                  : account.balance >= 0
                    ? '#43A047'
                    : theme.colors.error;

                return (
                  <View key={account.id}>
                    {index > 0 && <Divider style={styles.divider} />}
                    <View style={styles.row}>
                      <View style={[styles.badge, { backgroundColor: account.colorHex }]}>
                        <Icon source={meta?.icon ?? 'bank'} size={16} color="white" />
                      </View>
                      <View style={styles.flex1}>
                        <Text variant="bodyMedium">{account.name}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {isCreditCard ? 'Amount owed' : meta?.label}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" style={{ color: balanceColor }}>
                        {fmtAmount(account.balance, account.currency)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>

        {/* ── Spending by Category ───────────────────────────────────────── */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Spending by Category
            </Text>
            {categorySpending.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No spending this month.
              </Text>
            ) : (
              categorySpending.map((item, index) => (
                <View key={item.categoryId ?? 'uncategorized'}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: item.categoryColorHex ?? theme.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Icon source={item.categoryIcon ?? 'tag-outline'} size={16} color="white" />
                    </View>
                    <Text variant="bodyMedium" style={styles.flex1}>
                      {item.categoryName ?? 'Uncategorized'}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                      €{item.total.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* ── Recent Transactions ────────────────────────────────────────── */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Recent Transactions
            </Text>
            {recentTransactions.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No transactions yet.
              </Text>
            ) : (
              recentTransactions.map((tx, index) => (
                <View key={tx.id}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: tx.categoryColorHex ?? theme.colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Icon source={tx.categoryIcon ?? 'tag-outline'} size={16} color="white" />
                    </View>
                    <View style={styles.flex1}>
                      <Text variant="bodyMedium" numberOfLines={1}>
                        {tx.description}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {fmtShortDate(tx.transactionDate)}
                      </Text>
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={{ color: tx.amount < 0 ? theme.colors.error : '#43A047' }}
                    >
                      {tx.amount < 0 ? '−' : '+'}
                      {fmtAmount(tx.amount, tx.accountCurrency)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* ── Upcoming Settlements (hidden when empty) ───────────────────── */}
        {upcomingSettlements.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Upcoming Settlements
              </Text>
              {upcomingSettlements.map((stl, index) => (
                <View key={stl.id}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <View style={styles.row}>
                    <Icon
                      source="swap-horizontal"
                      size={24}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <View style={styles.flex1}>
                      <Text variant="bodyMedium">
                        {stl.fromAccountName ?? '?'} → {stl.toAccountName ?? '?'}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {fmtShortDate(stl.settlementDate)}
                      </Text>
                    </View>
                    <Text variant="bodyMedium">€{stl.amount.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  heading: { marginBottom: 4 },
  card: { borderRadius: 12 },
  cardTitle: { marginBottom: 8 },
  cardSubtitle: { marginTop: 2, marginBottom: 4 },
  divider: { marginVertical: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flex1: { flex: 1 },
});

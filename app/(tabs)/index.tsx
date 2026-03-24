import { useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, Icon, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-gifted-charts';

import { useDashboard, type DashboardCategoryRow } from '@/hooks/useDashboard';
import { fmtAmount } from '@/utils/currency';
import { fmtShortDate, fmtMonth } from '@/utils/date';

// ─── Donut chart ──────────────────────────────────────────────────────────────

function SpendingDonut({ data, total }: { data: DashboardCategoryRow[]; total: number }) {
  const theme = useTheme();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const focused = focusedIndex !== null ? data[focusedIndex] : null;

  const pieData = data.map((item, index) => ({
    value: item.total,
    color: item.categoryColorHex ?? theme.colors.surfaceVariant,
    focused: index === focusedIndex,
  }));

  return (
    <View style={donutStyles.container}>
      <PieChart
        data={pieData}
        donut
        radius={90}
        innerRadius={58}
        innerCircleColor={theme.colors.elevation.level1}
        focusOnPress
        toggleFocusOnPress
        onPress={(_: unknown, index: number) =>
          setFocusedIndex((prev) => (prev === index ? null : index))
        }
        centerLabelComponent={() => (
          <View style={donutStyles.center}>
            {focused ? (
              <>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                  numberOfLines={2}
                >
                  {focused.categoryName ?? 'Uncategorized'}
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.error, marginTop: 2 }}>
                  €{focused.total.toFixed(0)}
                </Text>
              </>
            ) : (
              <>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Total
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.error, marginTop: 2 }}>
                  €{total.toFixed(0)}
                </Text>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const donutStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  center: { alignItems: 'center', justifyContent: 'center', width: 100 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const theme = useTheme();

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const {
    availableMonths,
    totalSpentThisMonth,
    categorySpending,
    accountsWithBalance,
    upcomingSettlements,
    recentTransactions,
  } = useDashboard(selectedMonth);

  const idx = availableMonths.indexOf(selectedMonth);
  // availableMonths is sorted descending: higher index = older month
  const hasPrev = idx < availableMonths.length - 1;
  const hasNext = idx > 0;

  const navRef = useRef({ goPrev: () => {}, goNext: () => {} });

  navRef.current.goPrev = () => {
    if (hasPrev) setSelectedMonth(availableMonths[idx + 1]);
  };
  navRef.current.goNext = () => {
    if (hasNext) setSelectedMonth(availableMonths[idx - 1]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 20,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -60) navRef.current.goNext();
        else if (dx > 60) navRef.current.goPrev();
      },
    }),
  ).current;

  const totalBalance = accountsWithBalance.reduce(
    (sum, a) => sum + (a.type === 'credit_card' ? -a.balance : a.balance),
    0,
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
      {...panResponder.panHandlers}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── This Month ─────────────────────────────────────────────────── */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.monthNav}>
              <TouchableRipple
                onPress={navRef.current.goPrev}
                disabled={!hasPrev}
                borderless
                style={styles.monthNavBtn}
              >
                <Icon
                  source="chevron-left"
                  size={20}
                  color={hasPrev ? theme.colors.onSurface : 'transparent'}
                />
              </TouchableRipple>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {fmtMonth(selectedMonth).toUpperCase()}
              </Text>
              <TouchableRipple
                onPress={navRef.current.goNext}
                disabled={!hasNext}
                borderless
                style={styles.monthNavBtn}
              >
                <Icon
                  source="chevron-right"
                  size={20}
                  color={hasNext ? theme.colors.onSurface : 'transparent'}
                />
              </TouchableRipple>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.flex1}>
                <Text variant="titleMedium" style={styles.cardSubtitle}>
                  Total Spent
                </Text>
                <Text variant="displaySmall" style={{ color: theme.colors.error }}>
                  €{totalSpentThisMonth.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.flex1, { alignItems: 'flex-end' }]}>
                <Text variant="titleMedium" style={styles.cardSubtitle}>
                  Balance
                </Text>
                <Text
                  variant="displaySmall"
                  style={{ color: totalBalance >= 0 ? '#43A047' : theme.colors.error }}
                >
                  €{totalBalance.toFixed(2)}
                </Text>
              </View>
            </View>
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
              <>
                <SpendingDonut data={categorySpending} total={totalSpentThisMonth} />
                <View style={styles.divider} />
                {categorySpending.map((item, index) => (
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
                ))}
              </>
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
                      source="credit-card-outline"
                      size={24}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <View style={styles.flex1}>
                      <Text variant="bodyMedium">{stl.toAccountName ?? '?'}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Due {fmtShortDate(stl.settlementDate)}
                      </Text>
                    </View>
                    <Text variant="bodyMedium">{fmtAmount(stl.amount, stl.toAccountCurrency)}</Text>
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
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthNavBtn: {
    padding: 4,
    borderRadius: 12,
  },
});

import { useRef, useState } from 'react';
import { PanResponder, SectionList, StyleSheet, View } from 'react-native';
import { Divider, FAB, Icon, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTransactions, type TransactionRow } from '@/hooks/useTransactions';
import { formatSectionDate, fmtMonth } from '@/utils/date';

// ─── Date helpers ─────────────────────────────────────────────────────────────

type Section = { title: string; data: TransactionRow[] };

function groupByDate(rows: TransactionRow[]): Section[] {
  const map = new Map<string, TransactionRow[]>();
  for (const tx of rows) {
    if (!map.has(tx.transactionDate)) map.set(tx.transactionDate, []);
    map.get(tx.transactionDate)!.push(tx);
  }
  return Array.from(map.entries()).map(([date, data]) => ({
    title: formatSectionDate(date),
    data,
  }));
}

// ─── Amount formatter ─────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string | null): string {
  const sign = amount < 0 ? '−' : '+';
  return `${sign}${Math.abs(amount).toFixed(2)} ${currency ?? ''}`.trim();
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const theme = useTheme();

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { transactionsCurrentMonth, availableMonths } = useTransactions(selectedMonth);
  const sections = groupByDate(transactionsCurrentMonth);

  const idx = availableMonths.indexOf(selectedMonth);
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
      {...panResponder.panHandlers}
    >
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
            color={hasPrev ? theme.colors.onSurface : theme.colors.background}
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
            color={hasNext ? theme.colors.onSurface : theme.colors.background}
          />
        </TouchableRipple>
      </View>
      {transactionsCurrentMonth.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No transactions yet.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text
              variant="labelMedium"
              style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item, index, section }) => (
            <>
              {item.transferPairId != null ? (
                <View style={[styles.row, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View style={[styles.iconBadge, { backgroundColor: theme.colors.outline }]}>
                    <Icon source="swap-horizontal" size={18} color="white" />
                  </View>
                  <View style={styles.rowContent}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {item.accountName}
                    </Text>
                  </View>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatAmount(item.amount, item.accountCurrency)}
                  </Text>
                </View>
              ) : (
                <TouchableRipple onPress={() => router.push(`/transactions/${item.id}` as never)}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: item.categoryColorHex ?? theme.colors.surfaceVariant },
                      ]}
                    >
                      <Icon source={item.categoryIcon ?? 'tag-outline'} size={18} color="white" />
                    </View>
                    <View style={styles.rowContent}>
                      <Text variant="bodyMedium" numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.accountName}
                      </Text>
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: item.amount < 0 ? theme.colors.error : '#43A047',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatAmount(item.amount, item.accountCurrency)}
                    </Text>
                  </View>
                </TouchableRipple>
              )}
              {index < section.data.length - 1 && <Divider />}
            </>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => router.push('/transactions/new' as never)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { padding: 16 },
  empty: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  monthNavBtn: {
    padding: 4,
    borderRadius: 12,
  },
});

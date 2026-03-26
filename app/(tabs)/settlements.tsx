import { useRef, useState } from 'react';
import { PanResponder, SectionList, StyleSheet, View } from 'react-native';
import { Divider, FAB, Icon, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useSettlements, type SettlementRow } from '@/hooks/useSettlements';
import { fmtAmount } from '@/utils/currency';
import { formatSectionDate, fmtMonth } from '@/utils/date';

// ─── Date helpers ─────────────────────────────────────────────────────────────

type Section = { title: string; data: SettlementRow[] };

function groupByDate(rows: SettlementRow[]): Section[] {
  const map = new Map<string, SettlementRow[]>();
  for (const stl of rows) {
    if (!map.has(stl.settlementDate)) map.set(stl.settlementDate, []);
    map.get(stl.settlementDate)!.push(stl);
  }
  // Descending order (most recent first)
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({ title: formatSectionDate(date), data }));
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettlementsScreen() {
  const theme = useTheme();

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { settlements, availableMonths } = useSettlements(selectedMonth);
  const sections = groupByDate(settlements);

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
      {settlements.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No settlements yet.
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
              <TouchableRipple onPress={() => router.push(`/settlements/${item.id}` as never)}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: item.toAccountColorHex ?? '#6750A4' },
                    ]}
                  >
                    <Icon source="credit-card-outline" size={18} color="white" />
                  </View>
                  <View style={styles.rowContent}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {item.toAccountName ?? '?'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      from {item.fromAccountName ?? '?'}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={{ fontVariant: ['tabular-nums'] }}>
                    {fmtAmount(item.amount, item.toAccountCurrency)}
                  </Text>
                </View>
              </TouchableRipple>
              {index < section.data.length - 1 && <Divider />}
            </>
          )}
        />
      )}

      <FAB
        icon="credit-card-check-outline"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => router.push('/settlements/pay-bill' as never)}
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

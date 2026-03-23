import { SectionList, StyleSheet, View } from 'react-native';
import { Divider, FAB, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useSettlements, type SettlementRow } from '@/hooks/useSettlements';
import { fmtAmount } from '@/utils/currency';
import { formatSectionDate } from '@/utils/date';

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
  const { settlements } = useSettlements();
  const sections = groupByDate(settlements);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Text variant="headlineMedium" style={styles.heading}>
        Settlements
      </Text>

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
              {index < section.data.length - 1 && <Divider />}
            </>
          )}
        />
      )}

      <FAB
        icon="plus"
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
});

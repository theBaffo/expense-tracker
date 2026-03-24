import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, FAB, Icon, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAccounts } from '@/hooks/useAccounts';
import { useDashboard } from '@/hooks/useDashboard';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import { fmtAmount } from '@/utils/currency';

export default function AccountsScreen() {
  const theme = useTheme();
  const { accounts } = useAccounts();
  const { accountsWithBalance } = useDashboard();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      {accounts.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No accounts yet.
          </Text>
        </View>
      ) : (
        <ScrollView>
          {accounts.map((account, index) => {
            const meta = ACCOUNT_TYPE_META.find((m) => m.value === account.type);
            const isCreditCard = account.type === 'credit_card';
            const balance = accountsWithBalance.find((a) => a.id === account.id)?.balance ?? 0;
            const balanceColor = isCreditCard
              ? balance > 0
                ? theme.colors.error
                : theme.colors.onSurface
              : balance >= 0
                ? '#43A047'
                : theme.colors.error;

            return (
              <View key={account.id}>
                <List.Item
                  title={account.name}
                  description={
                    isCreditCard
                      ? 'Amount owed'
                      : `${meta?.label ?? account.type} · ${account.currency}`
                  }
                  left={() => (
                    <View style={[styles.iconBadge, { backgroundColor: account.colorHex }]}>
                      <Icon source={meta?.icon ?? 'bank'} size={20} color="white" />
                    </View>
                  )}
                  right={() => (
                    <View style={styles.rightContent}>
                      <Text variant="bodyMedium" style={{ color: balanceColor }}>
                        {fmtAmount(balance, account.currency)}
                      </Text>
                      <Icon
                        source="chevron-right"
                        size={20}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                  onPress={() => router.push(`/accounts/${account.id}` as never)}
                />
                {index < accounts.length - 1 && <Divider />}
              </View>
            );
          })}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => router.push('/accounts/new' as never)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { padding: 16 },
  empty: { flex: 1, paddingHorizontal: 16 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
  },
});

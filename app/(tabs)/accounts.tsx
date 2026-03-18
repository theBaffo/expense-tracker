import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, FAB, Icon, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAccounts } from '@/hooks/useAccounts';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';

export default function AccountsScreen() {
  const theme = useTheme();
  const { accounts } = useAccounts();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Text variant="headlineMedium" style={styles.heading}>
        Accounts
      </Text>

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
            return (
              <View key={account.id}>
                <List.Item
                  title={account.name}
                  description={`${meta?.label ?? account.type} · ${account.currency}`}
                  left={() => (
                    <View style={[styles.iconBadge, { backgroundColor: account.colorHex }]}>
                      <Icon source={meta?.icon ?? 'bank'} size={20} color="white" />
                    </View>
                  )}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
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
});

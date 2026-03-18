import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="headlineMedium" style={styles.heading}>
          Dashboard
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Net Worth</Text>
            <Text variant="displaySmall">€0.00</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">This Month</Text>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                  Income
                </Text>
                <Text variant="titleLarge">€0.00</Text>
              </View>
              <View style={styles.flex1}>
                <Text variant="labelMedium" style={{ color: theme.colors.error }}>
                  Expenses
                </Text>
                <Text variant="titleLarge">€0.00</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Recent Transactions</Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
            >
              No transactions yet.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  heading: { marginBottom: 4 },
  card: { borderRadius: 12 },
  row: { flexDirection: 'row', marginTop: 8 },
  flex1: { flex: 1 },
});

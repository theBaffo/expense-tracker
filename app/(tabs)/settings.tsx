import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, Divider, List, Portal, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { db } from '@/db';
import { accounts, categories, transactions, settlements } from '@/db/schema';
import { seedDefaults } from '@/db/seed';

export default function SettingsScreen() {
  const theme = useTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAll() {
    setDeleting(true);

    try {
      // Delete in dependency order to respect FK constraints
      await db.delete(settlements);
      await db.delete(transactions);
      await db.delete(categories);
      await db.delete(accounts);
      await seedDefaults();
    } finally {
      setDeleting(false);
      setConfirmVisible(false);
    }

    router.replace('/');
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView>
        <List.Section>
          <List.Subheader>General</List.Subheader>
          <List.Item
            title="Default Currency"
            description="EUR"
            left={(props) => <List.Icon {...props} icon="currency-eur" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Categories"
            left={(props) => <List.Icon {...props} icon="tag-multiple-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/categories' as never)}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Danger Zone</List.Subheader>
          <List.Item
            title="Delete All Data"
            description="Remove all transactions, settlements and accounts"
            titleStyle={{ color: theme.colors.error }}
            left={(props) => (
              <List.Icon {...props} icon="delete-forever-outline" color={theme.colors.error} />
            )}
            onPress={() => setConfirmVisible(true)}
          />
        </List.Section>
      </ScrollView>

      <Portal>
        <Dialog visible={confirmVisible} onDismiss={() => setConfirmVisible(false)}>
          <Dialog.Title>Delete All Data</Dialog.Title>
          <Dialog.Content>
            <Text>
              This will permanently delete all transactions, settlements, and accounts, then restore
              the default accounts and categories. This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmVisible(false)}>Cancel</Button>
            <Button
              onPress={handleDeleteAll}
              loading={deleting}
              disabled={deleting}
              textColor={theme.colors.error}
            >
              Delete Everything
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

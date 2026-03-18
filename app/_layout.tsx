import { useEffect } from 'react';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { View, Text, StyleSheet } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';

import { db } from '@/db';
import { accounts, categories } from '@/db/schema';
import migrations from '@/db/migrations/migrations';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { DEFAULT_ACCOUNTS } from '@/constants/accounts';

async function seedDefaults() {
  const [existingCategories, existingAccounts] = await Promise.all([
    db.select({ id: categories.id }).from(categories).limit(1),
    db.select({ id: accounts.id }).from(accounts).limit(1),
  ]);
  await Promise.all([
    existingCategories.length === 0
      ? db.insert(categories).values(DEFAULT_CATEGORIES)
      : Promise.resolve(),
    existingAccounts.length === 0
      ? db.insert(accounts).values(DEFAULT_ACCOUNTS)
      : Promise.resolve(),
  ]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success) {
      seedDefaults().catch(console.error);
    }
  }, [success]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Database error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.centered}>
        <Text>Loading database…</Text>
      </View>
    );
  }

  const navigationTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: theme.colors.background,
      card: theme.colors.surface,
    },
  };

  return (
    <PaperProvider theme={theme}>
      <ThemeProvider value={navigationTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { color: theme.colors.onSurface },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
  },
});

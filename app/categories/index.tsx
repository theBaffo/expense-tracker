import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, FAB, Icon, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';

import { useCategories } from '@/hooks/useCategories';

export default function CategoriesScreen() {
  const theme = useTheme();
  const { categories } = useCategories();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen options={{ title: 'Categories', headerShown: true }} />

      {categories.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No categories yet.
          </Text>
        </View>
      ) : (
        <ScrollView>
          {categories.map((category, index) => (
            <View key={category.id}>
              <List.Item
                title={category.name}
                left={() => (
                  <View style={[styles.iconBadge, { backgroundColor: category.colorHex }]}>
                    <Icon source={category.icon} size={20} color="white" />
                  </View>
                )}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push(`/categories/${category.id}` as never)}
              />
              {index < categories.length - 1 && <Divider />}
            </View>
          ))}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => router.push('/categories/new' as never)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, padding: 16 },
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

import { ScrollView, StyleSheet } from 'react-native';
import { Divider, List, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const theme = useTheme();

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { padding: 16 },
});

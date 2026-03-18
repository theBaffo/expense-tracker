import { ScrollView, StyleSheet } from 'react-native';
import { Divider, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView>
        <Text variant="headlineMedium" style={styles.heading}>
          Settings
        </Text>

        <List.Section>
          <List.Subheader>General</List.Subheader>
          <List.Item
            title="Default Currency"
            description="USD"
            left={(props) => <List.Icon {...props} icon="currency-usd" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Categories"
            left={(props) => <List.Icon {...props} icon="tag-multiple-outline" />}
            onPress={() => {}}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Data</List.Subheader>
          <List.Item
            title="Export to CSV"
            left={(props) => <List.Icon {...props} icon="file-export-outline" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Import Data"
            left={(props) => <List.Icon {...props} icon="file-import-outline" />}
            onPress={() => {}}
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

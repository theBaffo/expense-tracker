import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  Icon,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { useCategories } from '@/hooks/useCategories';
import { PRESET_COLORS, PRESET_ICONS } from '@/constants/categories';

export default function CategoryFormScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const numId = isNew ? null : parseInt(id, 10);

  const { categories, addCategory, updateCategory, deleteCategory, categoryHasTransactions } =
    useCategories();

  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState<string>(PRESET_COLORS[0]);
  const [icon, setIcon] = useState<string>(PRESET_ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteBlockedDialogVisible, setDeleteBlockedDialogVisible] = useState(false);

  // Pre-fill form in edit mode once categories load
  useEffect(() => {
    if (numId == null) return;
    const category = categories.find((c) => c.id === numId);
    
    if (category) {
      setName(category.name);
      setColorHex(category.colorHex);
      setIcon(category.icon);
    }
  }, [numId, categories]);

  async function handleSave() {
    if (!name.trim()) return;

    setSaving(true);
    
    try {
      if (isNew) {
        await addCategory({ name: name.trim(), icon, colorHex });
      } else {
        await updateCategory(numId!, { name: name.trim(), icon, colorHex });
      }

      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePress() {
    if (numId == null) return;
    
    const hasTransactions = await categoryHasTransactions(numId);
    
    if (hasTransactions) {
      setDeleteBlockedDialogVisible(true);
    } else {
      setDeleteDialogVisible(true);
    }
  }

  async function handleConfirmDelete() {
    if (numId == null) return;
    
    setDeleteDialogVisible(false);
    await deleteCategory(numId);
    router.back();
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen options={{ title: isNew ? 'New Category' : 'Edit Category', headerShown: true }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewBadge, { backgroundColor: colorHex }]}>
            <Icon source={icon} size={40} color="white" />
          </View>
          <Text variant="titleMedium" style={styles.previewName}>
            {name.trim() || 'Category Name'}
          </Text>
        </View>

        {/* Name */}
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.nameInput}
          autoCapitalize="words"
        />

        {/* Color picker */}
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Color
        </Text>
        <View style={styles.colorGrid}>
          {PRESET_COLORS.map((color) => (
            <TouchableRipple
              key={color}
              onPress={() => setColorHex(color)}
              borderless
              style={styles.colorSwatchWrapper}
            >
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  colorHex === color && {
                    borderWidth: 3,
                    borderColor: theme.colors.onBackground,
                  },
                ]}
              />
            </TouchableRipple>
          ))}
        </View>

        {/* Icon picker */}
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Icon
        </Text>
        <View style={styles.iconGrid}>
          {PRESET_ICONS.map((iconName) => (
            <TouchableRipple
              key={iconName}
              onPress={() => setIcon(iconName)}
              borderless
              style={styles.iconOptionWrapper}
            >
              <View
                style={[
                  styles.iconOption,
                  {
                    backgroundColor:
                      icon === iconName ? colorHex : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Icon
                  source={iconName}
                  size={24}
                  color={icon === iconName ? 'white' : theme.colors.onSurfaceVariant}
                />
              </View>
            </TouchableRipple>
          ))}
        </View>

        {/* Save */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !name.trim()}
          style={styles.saveButton}
        >
          Save
        </Button>

        {/* Delete (edit mode only) */}
        {!isNew && (
          <Button
            mode="outlined"
            onPress={handleDeletePress}
            textColor={theme.colors.error}
            style={[styles.deleteButton, { borderColor: theme.colors.error }]}
          >
            Delete Category
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Category</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleConfirmDelete} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={deleteBlockedDialogVisible}
          onDismiss={() => setDeleteBlockedDialogVisible(false)}
        >
          <Dialog.Title>Cannot Delete</Dialog.Title>
          <Dialog.Content>
            <Text>
              "{name}" has transactions linked to it and cannot be deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteBlockedDialogVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  preview: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  previewBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  previewName: {
    opacity: 0.8,
  },
  nameInput: {
    marginBottom: 24,
  },
  sectionLabel: {
    marginBottom: 10,
    opacity: 0.7,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  colorSwatchWrapper: {
    borderRadius: 20,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  iconOptionWrapper: {
    borderRadius: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginBottom: 12,
  },
  deleteButton: {
    marginBottom: 8,
  },
});

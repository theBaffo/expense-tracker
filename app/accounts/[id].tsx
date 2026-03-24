import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  Icon,
  Portal,
  RadioButton,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { useAccounts } from '@/hooks/useAccounts';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import { PRESET_COLORS } from '@/constants/categories';

type AccountType = 'current' | 'credit_card' | 'savings' | 'cash';

export default function AccountFormScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const numId = isNew ? null : parseInt(id, 10);

  const { accounts, addAccount, updateAccount, deleteAccount, accountHasActivity } = useAccounts();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('current');
  const [currency, setCurrency] = useState('EUR');
  const [colorHex, setColorHex] = useState<string>(PRESET_COLORS[4]); // Blue default
  const [startingBalance, setStartingBalance] = useState('0');
  const [creditLimit, setCreditLimit] = useState('');
  const [connectedAccountId, setConnectedAccountId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteBlockedDialogVisible, setDeleteBlockedDialogVisible] = useState(false);
  const [connectedPickerVisible, setConnectedPickerVisible] = useState(false);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (numId == null) return;
    const account = accounts.find((a) => a.id === numId);
    if (account) {
      setName(account.name);
      setType(account.type as AccountType);
      setCurrency(account.currency);
      setColorHex(account.colorHex);
      setStartingBalance(String(account.currentBalance));
      setCreditLimit(account.creditLimit != null ? String(account.creditLimit) : '');
      setConnectedAccountId(account.connectedAccountId ?? null);
    }
  }, [numId, accounts]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const values = {
        name: name.trim(),
        type,
        currency: currency.trim().toUpperCase() || 'EUR',
        colorHex,
        currentBalance: parseFloat(startingBalance) || 0,
        creditLimit: type === 'credit_card' && creditLimit ? parseFloat(creditLimit) : null,
        connectedAccountId: type === 'credit_card' ? connectedAccountId : null,
      };
      if (isNew) {
        await addAccount(values);
      } else {
        await updateAccount(numId!, values);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePress() {
    if (numId == null) return;
    const hasActivity = await accountHasActivity(numId);
    if (hasActivity) {
      setDeleteBlockedDialogVisible(true);
    } else {
      setDeleteDialogVisible(true);
    }
  }

  async function handleConfirmDelete() {
    if (numId == null) return;
    setDeleteDialogVisible(false);
    await deleteAccount(numId);
    router.back();
  }

  const currentTypeMeta = ACCOUNT_TYPE_META.find((m) => m.value === type);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{ title: isNew ? 'New Account' : 'Edit Account', headerShown: true }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewBadge, { backgroundColor: colorHex }]}>
            <Icon source={currentTypeMeta?.icon ?? 'bank'} size={40} color="white" />
          </View>
          <Text variant="titleMedium" style={styles.previewName}>
            {name.trim() || 'Account Name'}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {currentTypeMeta?.label} · {currency.trim().toUpperCase() || 'EUR'}
          </Text>
        </View>

        {/* Name */}
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          autoCapitalize="words"
        />

        {/* Account type */}
        <Text variant="labelLarge" style={styles.sectionLabel}>
          Account Type
        </Text>
        <View style={styles.typeGrid}>
          {ACCOUNT_TYPE_META.map((meta) => {
            const selected = type === meta.value;
            return (
              <TouchableRipple
                key={meta.value}
                onPress={() => setType(meta.value)}
                borderless
                style={styles.typeOptionWrapper}
              >
                <View
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: selected ? colorHex : theme.colors.surfaceVariant,
                      borderWidth: selected ? 0 : 1,
                      borderColor: theme.colors.outline,
                    },
                  ]}
                >
                  <Icon
                    source={meta.icon}
                    size={22}
                    color={selected ? 'white' : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="labelMedium"
                    style={[
                      styles.typeLabel,
                      { color: selected ? 'white' : theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </View>
              </TouchableRipple>
            );
          })}
        </View>

        {/* Currency */}
        <TextInput
          label="Currency"
          value={currency}
          onChangeText={setCurrency}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          maxLength={3}
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

        {/* Starting balance (not applicable for credit cards) */}
        {type !== 'credit_card' && (
          <TextInput
            label="Starting Balance"
            value={startingBalance}
            onChangeText={setStartingBalance}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
          />
        )}

        {/* Credit limit (credit card only) */}
        {type === 'credit_card' && (
          <TextInput
            label="Credit Limit"
            value={creditLimit}
            onChangeText={setCreditLimit}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            placeholder="Optional"
          />
        )}

        {/* Connected account (credit card only) */}
        {type === 'credit_card' && (
          <TouchableRipple onPress={() => setConnectedPickerVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Connected Account"
                value={accounts.find((a) => a.id === connectedAccountId)?.name ?? ''}
                mode="outlined"
                editable={false}
                style={styles.input}
                right={<TextInput.Icon icon="chevron-down" />}
                placeholder="Select account to pay from"
              />
            </View>
          </TouchableRipple>
        )}

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
            Delete Account
          </Button>
        )}
      </ScrollView>

      <Portal>
        {/* Connected account picker */}
        <Dialog visible={connectedPickerVisible} onDismiss={() => setConnectedPickerVisible(false)}>
          <Dialog.Title>Connected Account</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <RadioButton.Group
                value={connectedAccountId !== null ? String(connectedAccountId) : ''}
                onValueChange={(v) => {
                  setConnectedAccountId(parseInt(v, 10));
                  setConnectedPickerVisible(false);
                }}
              >
                {accounts
                  .filter((a) => a.type === 'current' || a.type === 'savings')
                  .map((account) => {
                    const meta = ACCOUNT_TYPE_META.find((m) => m.value === account.type);
                    return (
                      <TouchableRipple
                        key={account.id}
                        onPress={() => {
                          setConnectedAccountId(account.id);
                          setConnectedPickerVisible(false);
                        }}
                      >
                        <View style={styles.pickerRow}>
                          <View style={[styles.pickerBadge, { backgroundColor: account.colorHex }]}>
                            <Icon source={meta?.icon ?? 'bank'} size={14} color="white" />
                          </View>
                          <Text style={styles.flex1}>{account.name}</Text>
                          <RadioButton value={String(account.id)} />
                        </View>
                      </TouchableRipple>
                    );
                  })}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setConnectedPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete "{name}"? This action cannot be undone.</Text>
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
              "{name}" has transactions or settlements linked to it and cannot be deleted.
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
    marginBottom: 4,
  },
  input: {
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 10,
    opacity: 0.7,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  typeOptionWrapper: {
    borderRadius: 12,
    width: '47%',
  },
  typeOption: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  typeLabel: {
    textAlign: 'center',
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
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  deleteButton: {
    marginBottom: 8,
  },
  dialogScrollArea: { maxHeight: 320 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
  },
  pickerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
});

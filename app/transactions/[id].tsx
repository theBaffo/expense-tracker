import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  Icon,
  Portal,
  RadioButton,
  SegmentedButtons,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TransactionFormScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const numId = isNew ? null : parseInt(id, 10);

  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [isExpense, setIsExpense] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(todayISO);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  // Pre-select first account when creating a new transaction
  useEffect(() => {
    if (isNew && accountId === null && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [isNew, accounts, accountId]);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (numId == null) return;
    const tx = transactions.find((t) => t.id === numId);
    if (tx) {
      setIsExpense(tx.amount < 0);
      setAmount(String(Math.abs(tx.amount)));
      setDescription(tx.description);
      setAccountId(tx.accountId);
      setCategoryId(tx.categoryId ?? null);
      setDate(tx.transactionDate);
      setNotes(tx.notes ?? '');
    }
  }, [numId, transactions]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const canSave =
    description.trim().length > 0 &&
    amount.length > 0 &&
    parseFloat(amount) > 0 &&
    accountId !== null &&
    isValidDate(date);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!canSave || !accountId) return;
    setSaving(true);
    try {
      const parsedAmount = parseFloat(amount);
      const values = {
        accountId,
        categoryId,
        amount: isExpense ? -parsedAmount : parsedAmount,
        description: description.trim(),
        transactionDate: date,
        notes: notes.trim() || null,
      };
      if (isNew) {
        await addTransaction(values);
      } else {
        await updateTransaction(numId!, values);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (numId == null) return;
    setDeleteDialogVisible(false);
    await deleteTransaction(numId);
    router.back();
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{ title: isNew ? 'New Transaction' : 'Edit Transaction', headerShown: true }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Expense / Income toggle */}
        <SegmentedButtons
          value={isExpense ? 'expense' : 'income'}
          onValueChange={(v) => setIsExpense(v === 'expense')}
          buttons={[
            { value: 'expense', label: 'Expense', icon: 'arrow-up-circle-outline' },
            { value: 'income', label: 'Income', icon: 'arrow-down-circle-outline' },
          ]}
          style={styles.segmented}
        />

        {/* Amount */}
        <TextInput
          label="Amount *"
          value={amount}
          onChangeText={setAmount}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
          left={
            <TextInput.Affix
              text={selectedAccount?.currency ? `${selectedAccount.currency} ` : ''}
            />
          }
        />

        {/* Description */}
        <TextInput
          label="Description *"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          autoCapitalize="sentences"
        />

        {/* Account picker */}
        <Pressable onPress={() => setAccountPickerVisible(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Account *"
              value={selectedAccount?.name ?? ''}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" />}
              placeholder="Select an account"
            />
          </View>
        </Pressable>

        {/* Category picker */}
        <Pressable onPress={() => setCategoryPickerVisible(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Category"
              value={selectedCategory?.name ?? ''}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" />}
              placeholder="None"
            />
          </View>
        </Pressable>

        {/* Date */}
        <TextInput
          label="Date *"
          value={date}
          onChangeText={setDate}
          mode="outlined"
          style={styles.input}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          error={date.length === 10 && !isValidDate(date)}
        />

        {/* Notes */}
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />

        {/* Save */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !canSave}
          style={styles.saveButton}
        >
          Save
        </Button>

        {/* Delete (edit mode only) */}
        {!isNew && (
          <Button
            mode="outlined"
            onPress={() => setDeleteDialogVisible(true)}
            textColor={theme.colors.error}
            style={[styles.deleteButton, { borderColor: theme.colors.error }]}
          >
            Delete Transaction
          </Button>
        )}
      </ScrollView>

      <Portal>
        {/* Account picker dialog */}
        <Dialog visible={accountPickerVisible} onDismiss={() => setAccountPickerVisible(false)}>
          <Dialog.Title>Select Account</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <RadioButton.Group
                value={accountId !== null ? String(accountId) : ''}
                onValueChange={(v) => {
                  setAccountId(parseInt(v, 10));
                  setAccountPickerVisible(false);
                }}
              >
                {accounts.map((account) => (
                  <TouchableRipple
                    key={account.id}
                    onPress={() => {
                      setAccountId(account.id);
                      setAccountPickerVisible(false);
                    }}
                  >
                    <View style={styles.pickerRow}>
                      <View style={[styles.pickerBadge, { backgroundColor: account.colorHex }]} />
                      <Text style={styles.pickerLabel}>{account.name}</Text>
                      <RadioButton value={String(account.id)} />
                    </View>
                  </TouchableRipple>
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setAccountPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Category picker dialog */}
        <Dialog visible={categoryPickerVisible} onDismiss={() => setCategoryPickerVisible(false)}>
          <Dialog.Title>Select Category</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <RadioButton.Group
                value={categoryId !== null ? String(categoryId) : 'none'}
                onValueChange={(v) => {
                  setCategoryId(v === 'none' ? null : parseInt(v, 10));
                  setCategoryPickerVisible(false);
                }}
              >
                <TouchableRipple
                  onPress={() => {
                    setCategoryId(null);
                    setCategoryPickerVisible(false);
                  }}
                >
                  <View style={styles.pickerRow}>
                    <View
                      style={[styles.pickerBadge, { backgroundColor: theme.colors.surfaceVariant }]}
                    />
                    <Text style={[styles.pickerLabel, { color: theme.colors.onSurfaceVariant }]}>
                      None
                    </Text>
                    <RadioButton value="none" />
                  </View>
                </TouchableRipple>
                {categories.map((cat) => (
                  <TouchableRipple
                    key={cat.id}
                    onPress={() => {
                      setCategoryId(cat.id);
                      setCategoryPickerVisible(false);
                    }}
                  >
                    <View style={styles.pickerRow}>
                      <View style={[styles.pickerBadge, { backgroundColor: cat.colorHex }]}>
                        <Icon source={cat.icon} size={14} color="white" />
                      </View>
                      <Text style={styles.pickerLabel}>{cat.name}</Text>
                      <RadioButton value={String(cat.id)} />
                    </View>
                  </TouchableRipple>
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setCategoryPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Transaction</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this transaction? This cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleConfirmDelete} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  segmented: { marginBottom: 20 },
  input: { marginBottom: 20 },
  saveButton: { marginTop: 8, marginBottom: 12 },
  deleteButton: { marginBottom: 8 },
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
  pickerLabel: { flex: 1 },
});

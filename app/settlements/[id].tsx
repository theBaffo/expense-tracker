import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { useSettlements } from '@/hooks/useSettlements';
import { useDashboard } from '@/hooks/useDashboard';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import { fmtAmount } from '@/utils/currency';
import { isValidDate } from '@/utils/date';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditSettlementScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const numId = parseInt(id, 10);

  const { accounts } = useAccounts();
  const { settlements, updateSettlement, deleteSettlement } = useSettlements();
  const { accountsWithBalance } = useDashboard();

  const creditCards = accounts.filter((a) => a.type === 'credit_card');
  const sourceAccounts = accounts.filter((a) => a.type !== 'credit_card');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [toPickerVisible, setToPickerVisible] = useState(false);
  const [fromPickerVisible, setFromPickerVisible] = useState(false);

  // Pre-fill from existing settlement
  useEffect(() => {
    const stl = settlements.find((s) => s.id === numId);
    if (stl) {
      setToAccountId(stl.toAccountId);
      setFromAccountId(stl.fromAccountId);
      setAmount(String(stl.amount));
      setDate(stl.settlementDate);
      setNotes(stl.notes ?? '');
    }
  }, [numId, settlements]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedCreditCard = accounts.find((a) => a.id === toAccountId);
  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId);
  const outstandingBalance = accountsWithBalance.find((a) => a.id === toAccountId)?.balance ?? 0;

  const canSave =
    toAccountId !== null &&
    fromAccountId !== null &&
    amount.length > 0 &&
    parseFloat(amount) > 0 &&
    isValidDate(date);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function selectCreditCard(accountId: number) {
    setToAccountId(accountId);
    setToPickerVisible(false);
  }

  async function handleSave() {
    if (!canSave || !toAccountId || !fromAccountId) return;
    setSaving(true);
    try {
      await updateSettlement(numId, {
        fromAccountId,
        toAccountId,
        amount: parseFloat(amount),
        settlementDate: date,
        notes: notes.trim() || null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleteDialogVisible(false);
    await deleteSettlement(numId);
    router.back();
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen options={{ title: 'Edit Settlement', headerShown: true }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Credit card summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View
            style={[styles.badge, { backgroundColor: selectedCreditCard?.colorHex ?? '#6750A4' }]}
          >
            <Icon source="credit-card-outline" size={20} color="white" />
          </View>
          <View style={styles.flex1}>
            <Text variant="titleMedium">{selectedCreditCard?.name ?? '…'}</Text>
            {selectedCreditCard != null && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Outstanding balance
              </Text>
            )}
          </View>
          {selectedCreditCard != null && (
            <Text
              variant="titleMedium"
              style={{
                color: outstandingBalance > 0 ? theme.colors.error : theme.colors.onSurface,
              }}
            >
              {fmtAmount(outstandingBalance, selectedCreditCard.currency)}
            </Text>
          )}
        </View>

        {/* Credit card picker */}
        <Pressable onPress={() => setToPickerVisible(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Credit Card *"
              value={selectedCreditCard?.name ?? ''}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" />}
              placeholder="Select a credit card"
            />
          </View>
        </Pressable>

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
              text={selectedFromAccount?.currency ? `${selectedFromAccount.currency} ` : ''}
            />
          }
        />

        {/* From account picker */}
        <Pressable onPress={() => setFromPickerVisible(true)}>
          <View pointerEvents="none">
            <TextInput
              label="From Account *"
              value={selectedFromAccount?.name ?? ''}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" />}
              placeholder="Select an account"
            />
          </View>
        </Pressable>

        {/* Settlement date */}
        <TextInput
          label="Settlement Date *"
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

        {/* Delete */}
        <Button
          mode="outlined"
          onPress={() => setDeleteDialogVisible(true)}
          textColor={theme.colors.error}
          style={[styles.deleteButton, { borderColor: theme.colors.error }]}
        >
          Delete Settlement
        </Button>
      </ScrollView>

      <Portal>
        {/* Credit card picker dialog */}
        <Dialog visible={toPickerVisible} onDismiss={() => setToPickerVisible(false)}>
          <Dialog.Title>Credit Card to Pay</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <RadioButton.Group
                value={toAccountId !== null ? String(toAccountId) : ''}
                onValueChange={(v) => selectCreditCard(parseInt(v, 10))}
              >
                {creditCards.map((account) => {
                  const balance =
                    accountsWithBalance.find((a) => a.id === account.id)?.balance ?? 0;
                  return (
                    <TouchableRipple key={account.id} onPress={() => selectCreditCard(account.id)}>
                      <View style={styles.pickerRow}>
                        <View style={[styles.pickerBadge, { backgroundColor: account.colorHex }]}>
                          <Icon source="credit-card-outline" size={14} color="white" />
                        </View>
                        <Text style={styles.pickerLabel}>{account.name}</Text>
                        <Text
                          variant="bodySmall"
                          style={{
                            color: balance > 0 ? theme.colors.error : theme.colors.onSurfaceVariant,
                          }}
                        >
                          {fmtAmount(balance, account.currency)}
                        </Text>
                        <RadioButton value={String(account.id)} />
                      </View>
                    </TouchableRipple>
                  );
                })}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setToPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* From account picker dialog */}
        <Dialog visible={fromPickerVisible} onDismiss={() => setFromPickerVisible(false)}>
          <Dialog.Title>From Account</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <RadioButton.Group
                value={fromAccountId !== null ? String(fromAccountId) : ''}
                onValueChange={(v) => {
                  setFromAccountId(parseInt(v, 10));
                  setFromPickerVisible(false);
                }}
              >
                {sourceAccounts.map((account) => {
                  const meta = ACCOUNT_TYPE_META.find((m) => m.value === account.type);
                  return (
                    <TouchableRipple
                      key={account.id}
                      onPress={() => {
                        setFromAccountId(account.id);
                        setFromPickerVisible(false);
                      }}
                    >
                      <View style={styles.pickerRow}>
                        <View style={[styles.pickerBadge, { backgroundColor: account.colorHex }]}>
                          <Icon source={meta?.icon ?? 'bank'} size={14} color="white" />
                        </View>
                        <Text style={styles.pickerLabel}>{account.name}</Text>
                        <RadioButton value={String(account.id)} />
                      </View>
                    </TouchableRipple>
                  );
                })}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setFromPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Settlement</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this settlement? This cannot be undone.</Text>
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flex1: { flex: 1 },
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

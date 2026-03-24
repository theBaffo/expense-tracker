import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
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
import { defaultSettlementDate } from '@/utils/date';
import { DatePickerField } from '@/components/DatePickerField';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PayBillScreen() {
  const theme = useTheme();
  // creditCardId is optional — present when navigating from account detail, absent from FAB
  const { creditCardId } = useLocalSearchParams<{ creditCardId?: string }>();
  const initialCreditCardId = creditCardId ? parseInt(creditCardId, 10) : null;

  const { accounts } = useAccounts();
  const { addSettlement } = useSettlements();
  const { accountsWithBalance } = useDashboard();

  const creditCards = accounts.filter((a) => a.type === 'credit_card');
  const sourceAccounts = accounts.filter((a) => a.type !== 'credit_card');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [toAccountId, setToAccountId] = useState<number | null>(initialCreditCardId);
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultSettlementDate);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toPickerVisible, setToPickerVisible] = useState(false);
  const [fromPickerVisible, setFromPickerVisible] = useState(false);

  // Auto-fill amount from outstanding balance whenever the credit card changes
  useEffect(() => {
    if (toAccountId === null || amount !== '') return;
    const balance = accountsWithBalance.find((a) => a.id === toAccountId)?.balance ?? 0;
    if (balance > 0) setAmount(balance.toFixed(2));
  }, [toAccountId, accountsWithBalance, amount]);

  // Pre-select "from" account: use credit card's connectedAccountId, else prefer 'current'
  useEffect(() => {
    if (sourceAccounts.length === 0) return;
    const card = accounts.find((a) => a.id === toAccountId);
    if (card?.connectedAccountId != null) {
      setFromAccountId(card.connectedAccountId);
    } else if (fromAccountId === null) {
      const defaultFrom = sourceAccounts.find((a) => a.type === 'current') ?? sourceAccounts[0];
      setFromAccountId(defaultFrom.id);
    }
  }, [toAccountId, accounts, sourceAccounts, fromAccountId]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedCreditCard = accounts.find((a) => a.id === toAccountId);
  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId);
  const outstandingBalance = accountsWithBalance.find((a) => a.id === toAccountId)?.balance ?? 0;

  const canSave =
    toAccountId !== null &&
    fromAccountId !== null &&
    amount.length > 0 &&
    parseFloat(amount) > 0 &&
    date !== '';

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function selectCreditCard(id: number) {
    setToAccountId(id);
    setAmount(''); // clear so the auto-fill effect re-runs for the new card
    setFromAccountId(null); // clear so the connected account effect re-runs for the new card
    setToPickerVisible(false);
  }

  async function handleSave() {
    if (!canSave || !toAccountId || !fromAccountId) return;
    setSaving(true);
    try {
      await addSettlement({
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen options={{ title: 'Pay Bill', headerShown: true }} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Credit card summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View
            style={[styles.badge, { backgroundColor: selectedCreditCard?.colorHex ?? '#6750A4' }]}
          >
            <Icon source="credit-card-outline" size={20} color="white" />
          </View>
          <View style={styles.flex1}>
            <Text variant="titleMedium">{selectedCreditCard?.name ?? 'Select a credit card'}</Text>
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
        <DatePickerField
          label="Settlement Date *"
          value={date}
          onChange={setDate}
          style={styles.input}
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
          icon="credit-card-check-outline"
        >
          Pay Bill
        </Button>
      </KeyboardAwareScrollView>

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

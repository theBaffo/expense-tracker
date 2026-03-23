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
import { isValidDate, defaultSettlementDate } from '@/utils/date';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PayBillScreen() {
  const theme = useTheme();
  const { creditCardId } = useLocalSearchParams<{ creditCardId: string }>();
  const numCreditCardId = parseInt(creditCardId, 10);

  const { accounts } = useAccounts();
  const { addSettlement } = useSettlements();
  const { accountsWithBalance } = useDashboard();

  const creditCard = accounts.find((a) => a.id === numCreditCardId);
  const outstandingBalance =
    accountsWithBalance.find((a) => a.id === numCreditCardId)?.balance ?? 0;

  // Only non-credit-card accounts can be the source of a payment
  const sourceAccounts = accounts.filter((a) => a.type !== 'credit_card');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultSettlementDate);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [fromPickerVisible, setFromPickerVisible] = useState(false);

  // Pre-select default "from" account: prefer 'current', then first available
  useEffect(() => {
    if (fromAccountId === null && sourceAccounts.length > 0) {
      const defaultFrom = sourceAccounts.find((a) => a.type === 'current') ?? sourceAccounts[0];
      setFromAccountId(defaultFrom.id);
    }
  }, [sourceAccounts, fromAccountId]);

  // Pre-fill amount with the full outstanding balance once it loads
  useEffect(() => {
    if (outstandingBalance > 0 && amount === '') {
      setAmount(outstandingBalance.toFixed(2));
    }
  }, [outstandingBalance, amount]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId);

  const canSave =
    fromAccountId !== null && amount.length > 0 && parseFloat(amount) > 0 && isValidDate(date);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!canSave || !fromAccountId) return;
    setSaving(true);
    try {
      await addSettlement({
        fromAccountId,
        toAccountId: numCreditCardId,
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Credit card summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={[styles.badge, { backgroundColor: creditCard?.colorHex ?? '#6750A4' }]}>
            <Icon source="credit-card-outline" size={20} color="white" />
          </View>
          <View style={styles.flex1}>
            <Text variant="titleMedium">{creditCard?.name ?? '…'}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Outstanding balance
            </Text>
          </View>
          <Text
            variant="titleMedium"
            style={{ color: outstandingBalance > 0 ? theme.colors.error : theme.colors.onSurface }}
          >
            {fmtAmount(outstandingBalance, creditCard?.currency)}
          </Text>
        </View>

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
          icon="credit-card-check-outline"
        >
          Pay Bill
        </Button>
      </ScrollView>

      <Portal>
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

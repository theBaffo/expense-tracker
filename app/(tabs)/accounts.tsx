import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput as RNTextInput, View } from 'react-native';
import {
  Button,
  Dialog,
  Divider,
  FAB,
  Icon,
  List,
  Portal,
  RadioButton,
  Snackbar,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useDashboard } from '@/hooks/useDashboard';
import { ACCOUNT_TYPE_META } from '@/constants/accounts';
import { fmtAmount } from '@/utils/currency';

export default function AccountsScreen() {
  const theme = useTheme();
  const { accounts } = useAccounts();
  const { transferBetweenAccounts } = useTransactions();
  const { accountsWithBalance } = useDashboard();

  // ── Transfer dialog state ────────────────────────────────────────────────────
  const [fabOpen, setFabOpen] = useState(false);
  const [transferVisible, setTransferVisible] = useState(false);
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [fromPickerVisible, setFromPickerVisible] = useState(false);
  const [toPickerVisible, setToPickerVisible] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const amountRef = useRef<RNTextInput>(null);

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);

  const canTransfer =
    fromId !== null &&
    toId !== null &&
    fromId !== toId &&
    amount.length > 0 &&
    parseFloat(amount) > 0;

  function openTransferDialog() {
    setFromId(null);
    setToId(null);
    setAmount('');
    setTransferVisible(true);
  }

  async function handleTransfer() {
    if (!canTransfer || !fromId || !toId) return;

    setTransferring(true);

    try {
      await transferBetweenAccounts(
        fromId,
        fromAccount!.name,
        toId,
        toAccount!.name,
        parseFloat(amount),
      );
      setTransferVisible(false);
      setSnackbarVisible(true);
    } finally {
      setTransferring(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      {accounts.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No accounts yet.
          </Text>
        </View>
      ) : (
        <ScrollView>
          {accounts.map((account, index) => {
            const meta = ACCOUNT_TYPE_META.find((m) => m.value === account.type);
            const isCreditCard = account.type === 'credit_card';
            const balance = accountsWithBalance.find((a) => a.id === account.id)?.balance ?? 0;
            const balanceColor = isCreditCard
              ? balance > 0
                ? theme.colors.error
                : theme.colors.onSurface
              : balance >= 0
                ? '#43A047'
                : theme.colors.error;

            return (
              <View key={account.id}>
                <List.Item
                  title={account.name}
                  description={
                    isCreditCard
                      ? 'Amount owed'
                      : `${meta?.label ?? account.type} · ${account.currency}`
                  }
                  left={() => (
                    <View style={[styles.iconBadge, { backgroundColor: account.colorHex }]}>
                      <Icon source={meta?.icon ?? 'bank'} size={20} color="white" />
                    </View>
                  )}
                  right={() => (
                    <View style={styles.rightContent}>
                      <Text variant="bodyMedium" style={{ color: balanceColor }}>
                        {fmtAmount(balance, account.currency)}
                      </Text>
                      <Icon
                        source="chevron-right"
                        size={20}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                  onPress={() => router.push(`/accounts/${account.id}` as never)}
                />
                {index < accounts.length - 1 && <Divider />}
              </View>
            );
          })}
        </ScrollView>
      )}

      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        fabStyle={{ backgroundColor: theme.colors.primaryContainer }}
        color={theme.colors.onPrimaryContainer}
        actions={[
          {
            icon: 'bank-plus',
            label: 'New Account',
            onPress: () => router.push('/accounts/new' as never),
          },
          {
            icon: 'swap-horizontal',
            label: 'Transfer',
            onPress: openTransferDialog,
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        style={styles.fab}
      />

      <Portal>
        {/* Transfer dialog */}
        <Dialog visible={transferVisible} onDismiss={() => setTransferVisible(false)}>
          <Dialog.Title>Transfer Money</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Pressable onPress={() => setFromPickerVisible(true)}>
              <View pointerEvents="none">
                <TextInput
                  label="From *"
                  value={fromAccount?.name ?? ''}
                  mode="outlined"
                  editable={false}
                  style={styles.dialogInput}
                  right={<TextInput.Icon icon="chevron-down" />}
                  placeholder="Select source account"
                />
              </View>
            </Pressable>

            <Pressable onPress={() => setToPickerVisible(true)}>
              <View pointerEvents="none">
                <TextInput
                  label="To *"
                  value={toAccount?.name ?? ''}
                  mode="outlined"
                  editable={false}
                  style={styles.dialogInput}
                  right={<TextInput.Icon icon="chevron-down" />}
                  placeholder="Select destination account"
                />
              </View>
            </Pressable>

            <TextInput
              ref={amountRef}
              label="Amount *"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.dialogInput}
              returnKeyType="done"
              left={
                fromAccount?.currency ? (
                  <TextInput.Affix text={`${fromAccount.currency} `} />
                ) : undefined
              }
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTransferVisible(false)}>Cancel</Button>
            <Button
              onPress={handleTransfer}
              loading={transferring}
              disabled={transferring || !canTransfer}
            >
              Transfer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* From account picker */}
        <Dialog visible={fromPickerVisible} onDismiss={() => setFromPickerVisible(false)}>
          <Dialog.Title>From Account</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <RadioButton.Group
                value={fromId !== null ? String(fromId) : ''}
                onValueChange={(v) => {
                  setFromId(parseInt(v, 10));
                  setFromPickerVisible(false);
                }}
              >
                {accounts.map((account) => {
                  const meta = ACCOUNT_TYPE_META.find((m) => m.value === account.type);
                  return (
                    <TouchableRipple
                      key={account.id}
                      onPress={() => {
                        setFromId(account.id);
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

        {/* To account picker */}
        <Dialog visible={toPickerVisible} onDismiss={() => setToPickerVisible(false)}>
          <Dialog.Title>To Account</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <RadioButton.Group
                value={toId !== null ? String(toId) : ''}
                onValueChange={(v) => {
                  setToId(parseInt(v, 10));
                  setToPickerVisible(false);
                }}
              >
                {accounts.map((account) => {
                  const meta = ACCOUNT_TYPE_META.find((m) => m.value === account.type);
                  return (
                    <TouchableRipple
                      key={account.id}
                      onPress={() => {
                        setToId(account.id);
                        setToPickerVisible(false);
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
            <Button onPress={() => setToPickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        Transfer completed successfully.
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, paddingHorizontal: 16 },
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
    paddingRight: 0,
    paddingBottom: 8,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
  },
  dialogContent: { gap: 4 },
  dialogInput: { marginBottom: 8 },
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

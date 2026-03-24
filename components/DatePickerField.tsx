import { useState } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  label: string;
  /** ISO date string (YYYY-MM-DD) or empty string when unset. */
  value: string;
  onChange: (iso: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function DatePickerField({ label, value, onChange, style }: Props) {
  const [visible, setVisible] = useState(false);

  const date = isoToDate(value);
  const displayValue = date
    ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={style}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            value={displayValue}
            mode="outlined"
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
          />
        </View>
      </Pressable>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={visible}
        onDismiss={() => setVisible(false)}
        date={date}
        onConfirm={({ date: picked }) => {
          setVisible(false);
          if (picked) onChange(dateToISO(picked));
        }}
      />
    </>
  );
}

import { dateToISO, isoToDate } from '@/utils/date';
import { useState } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';

// TODO: use user locale when app will be fully localized
// const locale = resolvePickerLocale(getLocales()[0]?.languageTag ?? 'en');
const locale = 'en';

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
        locale={locale}
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

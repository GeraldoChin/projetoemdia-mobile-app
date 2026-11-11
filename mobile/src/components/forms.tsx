import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, fonts, radius } from '@/theme';
import type { Priority } from '@/api/types';
import { PRIORITY_COLOR, PRIORITY_LABEL } from '@/utils/labels';
import { formatDate } from '@/utils/format';
import { BottomSheet } from './BottomSheet';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

// ------------------------------------------------------------------ Campo de texto
interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: IconName;
  error?: string;
  required?: boolean;
  secureToggle?: boolean;
}

export function TextField({ label, icon, error, required, secureToggle, multiline, secureTextEntry, ...rest }: TextFieldProps) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  return (
    <View style={{ gap: 6 }}>
      <Text variant="labelMd" color={colors.onSurfaceVariant} uppercase>
        {label}{required ? <Text variant="labelMd" color={colors.error}> *</Text> : null}
      </Text>
      <View style={[styles.field, multiline && { alignItems: 'flex-start', paddingVertical: 12 }, !!error && styles.fieldError]}>
        {icon ? <Icon name={icon} size={20} color={colors.outline} /> : null}
        <TextInput
          {...rest}
          multiline={multiline}
          secureTextEntry={hidden}
          placeholderTextColor={colors.outline}
          style={[styles.input, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel={hidden ? 'Mostrar palavra-passe' : 'Ocultar palavra-passe'}>
            <Icon name={hidden ? 'visibility' : 'visibility-off'} size={20} color={colors.outline} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text variant="bodySm" color={colors.error}>{error}</Text> : null}
    </View>
  );
}

// ------------------------------------------------------------------ Data
export function DateField({ label, value, onChange, clearable = true }: {
  label: string;
  value: Date | null;
  onChange: (d: Date | null) => void;
  clearable?: boolean;
}) {
  const [iosOpen, setIosOpen] = useState(false);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(date);
        },
      });
    } else {
      setIosOpen((o) => !o);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <Text variant="labelMd" color={colors.onSurfaceVariant} uppercase>{label}</Text>
      <Pressable onPress={open} style={styles.field}>
        <Icon name="event" size={20} color={colors.outline} />
        <Text variant="bodyMd" color={value ? colors.onSurface : colors.outline} style={{ flex: 1 }}>
          {value ? formatDate(value.toISOString()) : 'Escolher data'}
        </Text>
        {value && clearable ? (
          <Pressable onPress={() => onChange(null)} hitSlop={10} accessibilityLabel="Limpar data">
            <Icon name="cancel" size={18} color={colors.outline} />
          </Pressable>
        ) : null}
      </Pressable>
      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="inline"
          onChange={(_e, date) => date && onChange(date)}
        />
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ Selecção (abre uma folha com opções)
export interface SelectOption { value: string; label: string; hint?: string }

export function SelectField({ label, value, options, onChange, placeholder = 'Escolher', icon }: {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: IconName;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      <Text variant="labelMd" color={colors.onSurfaceVariant} uppercase>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.field}>
        {icon ? <Icon name={icon} size={20} color={colors.outline} /> : null}
        <Text variant="bodyMd" color={current ? colors.onSurface : colors.outline} style={{ flex: 1 }} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Text>
        <Icon name="expand-more" size={20} color={colors.outline} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        {options.length === 0 ? <Text variant="bodySm" color={colors.onSurfaceVariant}>Sem opções disponíveis.</Text> : null}
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => { onChange(o.value); setOpen(false); }}
              style={[styles.option, selected && { backgroundColor: colors.secondaryFixed }]}
            >
              <View style={{ flex: 1 }}>
                <Text variant="headlineSm" style={{ fontSize: 14 }}>{o.label}</Text>
                {o.hint ? <Text variant="bodySm" color={colors.onSurfaceVariant}>{o.hint}</Text> : null}
              </View>
              {selected ? <Icon name="check" size={20} color={colors.onSecondaryFixed} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}

// ------------------------------------------------------------------ Prioridade
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

export function PrioritySelector({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="labelMd" color={colors.onSurfaceVariant} uppercase>Prioridade</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {PRIORITIES.map((p) => {
          const active = p === value;
          const c = PRIORITY_COLOR[p];
          return (
            <Pressable
              key={p}
              onPress={() => onChange(p)}
              style={[styles.priority, active ? { backgroundColor: p === 'HIGH' ? colors.primaryContainer : c.bg } : { backgroundColor: colors.surface }]}
            >
              <Text variant="labelLg" color={active ? (p === 'HIGH' ? colors.onPrimary : c.fg) : colors.onSurfaceVariant}>{PRIORITY_LABEL[p]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: 'transparent' },
  fieldError: { borderColor: colors.error },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.onSurface, paddingVertical: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.xl, backgroundColor: colors.surfaceLow },
  priority: { flex: 1, height: 44, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
});

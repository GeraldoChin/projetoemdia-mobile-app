import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, shadow, spacing } from '@/theme';
import { initials } from '@/utils/format';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

// ------------------------------------------------------------------ Card
export function Card({ children, style, onPress, padding = spacing.md }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
}) {
  const base = [styles.card, { padding }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

// ------------------------------------------------------------------ Badge
export function Badge({ label, fg = colors.onSecondaryFixed, bg = colors.secondaryFixed, dot, icon, style }: {
  label: string;
  fg?: string;
  bg?: string;
  dot?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {icon ? <Icon name={icon} size={13} color={fg} /> : null}
      <Text variant="labelSm" color={fg} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ Chip (filtros)
export function Chip({ label, count, active, onPress, dot, icon }: {
  label: string;
  count?: number;
  active?: boolean;
  onPress: () => void;
  dot?: string;
  icon?: IconName;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {icon ? <Icon name={icon} size={16} color={active ? colors.onPrimary : colors.onSurfaceVariant} /> : null}
      <Text variant="labelMd" color={active ? colors.onPrimary : colors.onSurfaceVariant}>{label}</Text>
      {count !== undefined ? (
        <View style={[styles.chipCount, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : colors.surface }]}>
          <Text variant="labelSm" color={active ? colors.onPrimary : colors.onSurfaceVariant}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {children}
    </ScrollView>
  );
}

// ------------------------------------------------------------------ Controlo segmentado
export function SegmentedControl<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.segmentItem, active && styles.segmentItemActive]}>
            <Text variant="labelLg" color={active ? colors.onPrimary : colors.onSurfaceVariant}>
              {o.label}
              {o.count !== undefined ? <Text variant="bodySm" color={active ? colors.onPrimary : colors.onSurfaceVariant}>{` (${o.count})`}</Text> : null}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ------------------------------------------------------------------ Progresso
export function ProgressBar({ percent, color = colors.primaryContainer, track = colors.surface, height = 8 }: {
  percent: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  return (
    <View style={{ height, borderRadius: radius.full, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, percent))}%`, height: '100%', borderRadius: radius.full, backgroundColor: color }} />
    </View>
  );
}

export function ProgressRing({ percent, size = 48, stroke = 3.5 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={colors.secondaryFixed} strokeWidth={stroke} fill="none"
          strokeDasharray={`${(Math.max(0, Math.min(100, percent)) / 100) * c} ${c}`} strokeLinecap="round"
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="labelMd" color={colors.onPrimary}>{Math.round(percent)}%</Text>
        </View>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ Avatares
const AVATAR_COLORS = [colors.primaryContainer, colors.secondary, '#244F78', '#2F5982', '#1D4972'];
const colorFor = (name: string) => AVATAR_COLORS[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];

export function Avatar({ name, uri, size = 32, online }: { name: string; uri?: string | null; size?: number; online?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface }} />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colorFor(name), alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="labelMd" color={colors.onPrimary} style={{ fontSize: Math.max(9, size * 0.36) }}>{initials(name)}</Text>
        </View>
      )}
      {online !== undefined ? (
        <View style={[styles.presence, { backgroundColor: online ? colors.success : colors.warning, width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]} />
      ) : null}
    </View>
  );
}

export function AvatarStack({ people, max = 3, size = 28 }: { people: { id: string; name: string; avatarUrl: string | null }[]; max?: number; size?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <View style={{ flexDirection: 'row' }}>
      {shown.map((p, i) => (
        <View key={p.id} style={[styles.stackItem, { marginLeft: i === 0 ? 0 : -size * 0.3, borderRadius: size }]}>
          <Avatar name={p.name} uri={p.avatarUrl} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.stackItem, { marginLeft: -size * 0.3, width: size + 4, height: size + 4, borderRadius: size, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' }]}>
          <Text variant="labelSm" color={colors.onSurfaceVariant}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ Logótipo provisório
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="check" size={size * 0.62} color={colors.secondaryFixed} />
    </View>
  );
}

// ------------------------------------------------------------------ Botões
export function Button({ label, onPress, variant = 'primary', icon, trailingIcon, loading, disabled, style }: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'tonal';
  icon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.primaryContainer, fg: colors.onPrimary },
    secondary: { bg: colors.surface, fg: colors.onSurface },
    tonal: { bg: colors.secondaryFixed, fg: colors.onSecondaryFixed },
    danger: { bg: colors.dangerBg, fg: colors.danger },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, { backgroundColor: palette.bg, opacity: off ? 0.6 : 1 }, variant === 'primary' && shadow.card, pressed && { transform: [{ scale: 0.98 }] }, style]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={palette.fg} /> : null}
          <Text variant="headlineSm" color={palette.fg} style={{ fontSize: 14 }}>{label}</Text>
          {trailingIcon ? (
            <View style={styles.trailing}>
              <Icon name={trailingIcon} size={16} color={palette.fg} />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, size = 40, bg = colors.surfaceLowest, color = colors.onSurfaceVariant, label, badge }: {
  icon: IconName;
  onPress: () => void;
  size?: number;
  bg?: string;
  color?: string;
  label: string;
  badge?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, bg === colors.surfaceLowest && shadow.card, pressed && { transform: [{ scale: 0.94 }] }]}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={color} />
      {badge ? <View style={styles.bell} /> : null}
    </Pressable>
  );
}

/** Botão flutuante com etiqueta ("Novo projecto", "Nova Tarefa"). */
export function Fab({ label, icon = 'add', onPress, bottom = 100 }: { label: string; icon?: IconName; onPress: () => void; bottom?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, shadow.float, { bottom }, pressed && { transform: [{ scale: 0.96 }] }]}>
      <Icon name={icon} size={22} color={colors.onPrimary} />
      <Text variant="headlineSm" color={colors.onPrimary} style={{ fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

// ------------------------------------------------------------------ Estados
export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={32} color={colors.onSurfaceVariant} />
      </View>
      <Text variant="headlineSm" style={{ textAlign: 'center' }}>{title}</Text>
      {text ? <Text variant="bodySm" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>{text}</Text> : null}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primaryContainer} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.errorContainer }]}>
        <Icon name="cloud-off" size={30} color={colors.error} />
      </View>
      <Text variant="headlineSm" style={{ textAlign: 'center' }}>Não foi possível carregar</Text>
      <Text variant="bodySm" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>{message}</Text>
      <Button label="Tentar novamente" variant="tonal" onPress={onRetry} style={{ alignSelf: 'center', paddingHorizontal: 24 }} />
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="headlineSm">{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceLowest, borderRadius: radius.xl, ...shadow.card },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full },
  chipActive: { backgroundColor: colors.primaryContainer, ...shadow.card },
  chipIdle: { backgroundColor: colors.surfaceLowest, ...shadow.card },
  chipCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.full },
  chipRow: { gap: 8, paddingVertical: 4, paddingRight: spacing.screen },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.full, backgroundColor: colors.surfaceHigh },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: colors.primaryContainer, ...shadow.card },
  presence: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2, borderColor: colors.surfaceLowest },
  stackItem: { borderWidth: 2, borderColor: colors.surfaceLowest, overflow: 'hidden' },
  button: { minHeight: 48, borderRadius: radius.full, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  trailing: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  bell: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.error, borderWidth: 1.5, borderColor: colors.background },
  fab: { position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: radius.full, backgroundColor: colors.primaryContainer },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});

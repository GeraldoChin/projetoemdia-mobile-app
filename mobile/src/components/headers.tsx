import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadCount } from '@/api/hooks';
import { useAuth } from '@/auth/AuthProvider';
import { colors, spacing } from '@/theme';
import { Avatar, IconButton, Logo } from './primitives';
import { Text } from './Text';

/** Cabeçalho dos separadores: logótipo, nome do ecrã, sino (com ponto se houver por ler) e avatar. */
export function AppHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const unread = useUnreadCount();

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Logo size={32} />
          <View>
            <Text variant="labelSm" color={colors.secondary} uppercase style={{ lineHeight: 12 }}>ProjetoEmDia</Text>
            <Text variant="headlineSm" style={{ lineHeight: 20 }}>{title}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconButton
            icon="notifications-none"
            label="Notificações"
            size={44}
            bg="transparent"
            badge={(unread.data?.count ?? 0) > 0}
            onPress={() => router.push('/notifications')}
          />
          {user ? <Avatar name={user.name} uri={user.avatarUrl} size={32} /> : null}
        </View>
      </View>
    </View>
  );
}

/** Cabeçalho dos ecrãs de detalhe (pilha): voltar + título + acções à direita. */
export function DetailHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
          <IconButton icon="arrow-back" label="Voltar" size={44} bg="transparent" color={colors.onSurface} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          <Text variant="headlineMd" numberOfLines={1} style={{ flex: 1 }}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.background, paddingHorizontal: spacing.screen },
  row: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { getErrorMessage } from '@/api/client';
import { useMe, useUpdateSettings } from '@/api/hooks';
import { useAuth } from '@/auth/AuthProvider';
import { AppHeader } from '@/components/headers';
import { Icon, IconName } from '@/components/Icon';
import { Avatar, Badge, Button, Card, ErrorState, IconButton, LoadingState } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { ChangePasswordSheet, EditProfileSheet } from '@/features/ProfileSheets';
import { colors, radius, spacing } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { logout } = useAuth();
  const me = useMe();
  const updateSettings = useUpdateSettings();

  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const data = me.data;

  const setSetting = (input: { pushEnabled?: boolean; deadlineRemindersEnabled?: boolean }) =>
    updateSettings.mutate(input, {
      onSuccess: () => toast.show('Definição actualizada'),
      onError: (e) => toast.show(getErrorMessage(e), 'error'),
    });

  const confirmLogout = () =>
    Alert.alert('Terminar sessão', 'Tem a certeza de que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Terminar sessão',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Perfil" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 130, gap: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={me.isRefetching} onRefresh={() => { void me.refetch(); }} tintColor={colors.primaryContainer} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineLg">O Meu Perfil</Text>
            <Text variant="bodySm" color={colors.onSurfaceVariant}>Gestão de conta & preferências de trabalho</Text>
          </View>
          <IconButton
            icon="share"
            label="Partilhar perfil"
            onPress={() => data && Share.share({ message: `${data.name} — ${data.jobTitle ?? 'ProjetoEmDia'} (${data.email})` })}
          />
        </View>

        {me.isLoading ? <LoadingState /> : null}
        {me.isError && !data ? <ErrorState message={getErrorMessage(me.error)} onRetry={() => me.refetch()} /> : null}

        {data ? (
          <>
            {/* Identidade */}
            <Card style={{ alignItems: 'center', gap: 6 }} padding={24}>
              <View style={{ marginBottom: 8 }}>
                <Avatar name={data.name} uri={data.avatarUrl} size={96} online />
              </View>
              <Text variant="headlineMd">{data.name}</Text>
              {data.jobTitle ? <Text variant="labelLg" color={colors.secondary} style={{ textAlign: 'center' }}>{data.jobTitle}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginVertical: 8 }}>
                <Chip2 icon="mail-outline" label={data.email} />
                {data.city ? <Chip2 icon="location-on" label={`${data.city}, Moçambique`} /> : null}
              </View>
              <Button label="Editar Perfil" icon="edit" onPress={() => setEditing(true)} style={{ alignSelf: 'center', minHeight: 44, paddingHorizontal: 22 }} />
            </Card>

            {/* Estatísticas */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Stat icon="folder-special" value={String(data.stats.projectsTotal)} label="Projectos Totais" />
              <Stat icon="speed" value={`${data.stats.onTimePercent}%`} label="No Prazo" good />
              <Stat icon="task-alt" value={String(data.stats.delivered)} label="Entregues" />
            </View>

            {/* Preferências */}
            <Group title="Preferências da Conta">
              <ToggleRow icon="notifications-active" title="Notificações Push" subtitle="Alertas em tempo real na app" value={data.pushEnabled} onChange={(v) => setSetting({ pushEnabled: v })} />
              <Divider />
              <ToggleRow icon="alarm" title="Lembretes de Prazos" subtitle="Avisos prévios de 24h e 2h" value={data.deadlineRemindersEnabled} onChange={(v) => setSetting({ deadlineRemindersEnabled: v })} />
              <Divider />
              <Row icon="translate" title="Idioma da Aplicação" subtitle="Português de Moçambique" trailing={<Text variant="labelSm" color={colors.secondary}>PT-MZ</Text>} />
            </Group>

            <Group title="Segurança & Dados">
              <Row icon="lock-reset" title="Alterar Palavra-passe" subtitle="Escolha uma palavra-passe forte" onPress={() => setChangingPassword(true)} chevron />
              <Divider />
              <Row icon="shield" title="Autenticação em Dois Passos (2FA)" subtitle="Camada extra de segurança" trailing={<Badge label="Não configurado" fg={colors.neutral} bg={colors.neutralBg} />} />
              <Divider />
              <Row icon="cloud-sync" title="Sincronização na Nuvem" subtitle="Os dados ficam guardados no servidor" onPress={() => { void me.refetch(); toast.show('Dados sincronizados'); }} chevron />
            </Group>

            <Group title="Ajuda & Termos">
              <Row icon="support-agent" title="Centro de Suporte" subtitle="Perguntas frequentes e apoio directo" onPress={() => router.push('/help')} chevron />
              <Divider />
              <Row icon="policy" title="Termos de Utilização e Privacidade" subtitle="Abre as regras de utilizaÃ§Ã£o e o resumo de privacidade" onPress={() => router.push('/terms')} chevron />
              <Divider />
              <Row icon="info-outline" title="Versão da Aplicação" subtitle="Build de desenvolvimento" trailing={<Badge label={`v${Constants.expoConfig?.version ?? '1.0.0'}`} fg={colors.onSurfaceVariant} bg={colors.surface} />} />
            </Group>

            <Button label="Terminar Sessão" icon="logout" variant="danger" onPress={confirmLogout} loading={loggingOut} style={{ borderRadius: radius.xl }} />
          </>
        ) : null}
      </ScrollView>

      <EditProfileSheet visible={editing} onClose={() => setEditing(false)} me={data} />
      <ChangePasswordSheet visible={changingPassword} onClose={() => setChangingPassword(false)} />
    </View>
  );
}

// ------------------------------------------------------------------ blocos
function Chip2({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, backgroundColor: colors.surfaceLow }}>
      <Icon name={icon} size={15} color={colors.secondary} />
      <Text variant="bodySm" color={colors.onSurfaceVariant}>{label}</Text>
    </View>
  );
}

function Stat({ icon, value, label, good }: { icon: IconName; value: string; label: string; good?: boolean }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: 2 }} padding={12}>
      <View style={[styles.statIcon, { backgroundColor: good ? colors.successBg : 'rgba(209,228,255,0.5)' }]}>
        <Icon name={icon} size={18} color={good ? colors.success : colors.secondary} />
      </View>
      <Text variant="displaySm" color={good ? colors.success : colors.onSurface}>{value}</Text>
      <Text variant="labelSm" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>{label}</Text>
    </Card>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="labelMd" color={colors.onSurfaceVariant} uppercase style={{ paddingHorizontal: 4 }}>{title}</Text>
      <Card padding={0} style={{ overflow: 'hidden' }}>{children}</Card>
    </View>
  );
}

const Divider = () => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.surfaceHigh, marginHorizontal: 14 }} />;

function RowShell({ icon, title, subtitle, children }: { icon: IconName; title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={20} color={colors.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="labelLg">{title}</Text>
        <Text variant="bodySm" color={colors.onSurfaceVariant}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ icon, title, subtitle, trailing, onPress, chevron }: { icon: IconName; title: string; subtitle: string; trailing?: React.ReactNode; onPress?: () => void; chevron?: boolean }) {
  const content = (
    <RowShell icon={icon} title={title} subtitle={subtitle}>
      {trailing}
      {chevron ? <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} /> : null}
    </RowShell>
  );
  return onPress ? <Pressable onPress={onPress} android_ripple={{ color: colors.surface }}>{content}</Pressable> : content;
}

function ToggleRow({ icon, title, subtitle, value, onChange }: { icon: IconName; title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <RowShell icon={icon} title={title} subtitle={subtitle}>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceHighest, true: colors.primaryContainer }}
        thumbColor={colors.surfaceLowest}
      />
    </RowShell>
  );
}

const styles = StyleSheet.create({
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});

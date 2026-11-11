import React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { getErrorMessage } from '@/api/client';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/api/hooks';
import type { AppNotification, NotificationType } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { DetailHeader } from '@/components/headers';
import { Icon, IconName } from '@/components/Icon';
import { Card, EmptyState, ErrorState, LoadingState } from '@/components/primitives';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';
import { timeAgo } from '@/utils/format';

const ICON: Record<NotificationType, IconName> = {
  TASK_ASSIGNED: 'assignment-ind',
  TASK_COMMENTED: 'chat-bubble-outline',
  PROJECT_INVITE: 'group-add',
  DEADLINE_REMINDER: 'alarm',
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const list = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (!user) return <Redirect href="/login" />;

  const items = list.data ?? [];
  const unread = items.filter((n) => !n.read).length;

  const open = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.data?.taskId) router.push(`/task/${n.data.taskId}`);
    else if (n.data?.projectId) router.push(`/project/${n.data.projectId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeader
        title="Notificações"
        right={unread > 0 ? (
          <Pressable onPress={() => markAll.mutate()} hitSlop={8}>
            <Text variant="labelLg" color={colors.secondary}>Marcar todas</Text>
          </Pressable>
        ) : undefined}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.screen, gap: 10, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => { void list.refetch(); }} tintColor={colors.primaryContainer} />}
      >
        {list.isLoading ? <LoadingState /> : null}
        {list.isError && !list.data ? <ErrorState message={getErrorMessage(list.error)} onRetry={() => list.refetch()} /> : null}
        {list.data && items.length === 0 ? <EmptyState icon="notifications-none" title="Sem notificações" text="Quando alguém lhe atribuir uma tarefa ou comentar, aparece aqui." /> : null}

        {items.map((n) => (
          <Card key={n.id} onPress={() => open(n)} padding={14} style={[{ flexDirection: 'row', gap: 12, alignItems: 'center' }, !n.read && { backgroundColor: 'rgba(209,228,255,0.45)' }]}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={ICON[n.type]} size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="labelLg">{n.title}</Text>
              {n.body ? <Text variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>{n.body}</Text> : null}
              <Text variant="labelSm" color={colors.outline} style={{ marginTop: 2 }}>{timeAgo(n.createdAt)}</Text>
            </View>
            {!n.read ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.error }} /> : null}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

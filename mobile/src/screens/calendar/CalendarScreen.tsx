import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/api/hooks';
import { AppHeader } from '@/components/headers';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '@/components/primitives';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';
import { formatDateLong, formatTime } from '@/utils/format';
import { PRIORITY_COLOR, PRIORITY_LABEL } from '@/utils/labels';

export default function CalendarScreen() {
  const router = useRouter();
  const tasks = useTasks({});
  const upcoming = useMemo(() => [...(tasks.data?.items ?? [])].filter((task) => task.dueDate && task.status !== 'DONE').sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()), [tasks.data]);
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Agenda" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 130, gap: 12 }} refreshControl={<RefreshControl refreshing={tasks.isRefetching} onRefresh={() => { void tasks.refetch(); }} tintColor={colors.primaryContainer} />}>
        <View style={{ gap: 4, marginBottom: 4 }}>
          <Text variant="headlineLg">Próximos prazos</Text>
          <Text variant="bodySm" color={colors.onSurfaceVariant}>Tarefas por ordem de data de entrega.</Text>
        </View>
        {tasks.isLoading ? <LoadingState /> : null}
        {tasks.isError && !tasks.data ? <ErrorState message="Não foi possível carregar os prazos." onRetry={() => tasks.refetch()} /> : null}
        {tasks.data && upcoming.length === 0 ? <EmptyState icon="event-available" title="Sem prazos pendentes" text="Quando as tarefas tiverem datas de entrega, aparecem aqui." /> : null}
        {upcoming.map((task) => (
          <Card key={task.id} onPress={() => router.push(`/task/${task.id}`)} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}><Icon name="event" color={colors.secondary} /></View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text variant="labelLg" numberOfLines={1}>{task.title}</Text>
              <Text variant="bodySm" color={colors.onSurfaceVariant}>{task.project.title} · {formatDateLong(task.dueDate)} {formatTime(task.dueDate)}</Text>
            </View>
            <Badge label={PRIORITY_LABEL[task.priority]} fg={PRIORITY_COLOR[task.priority].fg} bg={PRIORITY_COLOR[task.priority].bg} />
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

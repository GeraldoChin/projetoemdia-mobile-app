import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getErrorMessage } from '@/api/client';
import { useProjects, useSetTaskStatus, useTasks } from '@/api/hooks';
import { useAuth } from '@/auth/AuthProvider';
import type { Priority } from '@/api/types';
import { AppHeader } from '@/components/headers';
import { Badge, Chip, ChipRow, EmptyState, ErrorState, Fab, LoadingState, SegmentedControl } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { TaskCard } from '@/features/cards';
import { TaskFormSheet } from '@/features/TaskFormSheet';
import { colors, spacing } from '@/theme';
import { PRIORITY_COLOR } from '@/utils/labels';

type State = 'all' | 'pending' | 'completed';
type PriorityFilter = 'ALL' | Priority;

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const params = useLocalSearchParams<{ new?: string }>();
  const projects = useProjects({ status: 'ACTIVE' });
  const canCreateTask = !!user && !!projects.data?.items.some((project) => project.ownerId === user.id);

  const [state, setState] = useState<State>('all');
  const [priority, setPriority] = useState<PriorityFilter>('ALL');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (params.new === '1' && projects.data) {
      if (canCreateTask) setCreating(true);
      router.setParams({ new: undefined });
    }
  }, [params.new, router, projects.data, canCreateTask]);

  const tasks = useTasks({
    state: state === 'all' ? undefined : state,
    priority: priority === 'ALL' ? undefined : priority,
  });
  const setStatus = useSetTaskStatus();
  const counts = tasks.data?.counts;
  const items = tasks.data?.items ?? [];

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Tarefas" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 180, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={tasks.isRefetching} onRefresh={() => { void tasks.refetch(); }} tintColor={colors.primaryContainer} />}
      >
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headlineLg">Minhas tarefas</Text>
            <Badge label={`${counts?.all ?? 0} no total`} dot={colors.secondary} fg={colors.onSecondaryFixed} bg="rgba(168,207,255,0.4)" style={{ paddingVertical: 5 }} />
          </View>
          <Text variant="bodyMd" color={colors.onSurfaceVariant}>Organize e acompanhe as suas entregas diárias</Text>
        </View>

        <SegmentedControl<State>
          value={state}
          onChange={setState}
          options={[
            { key: 'all', label: 'Todas', count: counts?.all },
            { key: 'pending', label: 'Pendentes', count: counts?.pending },
            { key: 'completed', label: 'Concluídas', count: counts?.completed },
          ]}
        />

        <ChipRow>
          <Chip label="Todas" active={priority === 'ALL'} onPress={() => setPriority('ALL')} />
          <Chip label="Alta prioridade" dot={PRIORITY_COLOR.HIGH.dot} active={priority === 'HIGH'} onPress={() => setPriority('HIGH')} />
          <Chip label="Média" dot={PRIORITY_COLOR.MEDIUM.dot} active={priority === 'MEDIUM'} onPress={() => setPriority('MEDIUM')} />
          <Chip label="Baixa" dot={PRIORITY_COLOR.LOW.dot} active={priority === 'LOW'} onPress={() => setPriority('LOW')} />
        </ChipRow>

        {tasks.isLoading ? <LoadingState /> : null}
        {tasks.isError && !tasks.data ? <ErrorState message={getErrorMessage(tasks.error)} onRetry={() => tasks.refetch()} /> : null}
        {tasks.data && items.length === 0 ? (
          <EmptyState icon="checklist-rtl" title="Nenhuma tarefa encontrada" text="Experimente ajustar os filtros ou adicione uma nova tarefa para começar." />
        ) : null}

        {items.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onPress={() => router.push(`/task/${t.id}`)}
            onToggle={() => setStatus.mutate({ id: t.id, status: t.status === 'DONE' ? 'TODO' : 'DONE' }, { onError: (e) => toast.show(getErrorMessage(e), 'error') })}
          />
        ))}
      </ScrollView>

      {canCreateTask ? <Fab label="Nova Tarefa" onPress={() => setCreating(true)} /> : null}
      <TaskFormSheet visible={creating} onClose={() => setCreating(false)} />
    </View>
  );
}

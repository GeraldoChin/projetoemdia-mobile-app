import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useProjects, useTasks } from '@/api/hooks';
import { AppHeader } from '@/components/headers';
import { Card, ErrorState, LoadingState, ProgressBar } from '@/components/primitives';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';

export default function StatsScreen() {
  const projects = useProjects({});
  const tasks = useTasks({});
  const busy = projects.isLoading || tasks.isLoading;
  const error = (projects.isError && !projects.data) || (tasks.isError && !tasks.data);
  const refresh = () => { void projects.refetch(); void tasks.refetch(); };
  const taskCounts = tasks.data?.counts;
  const projectItems = projects.data?.items ?? [];
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Estatísticas" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 130, gap: 16 }} refreshControl={<RefreshControl refreshing={projects.isRefetching || tasks.isRefetching} onRefresh={refresh} tintColor={colors.primaryContainer} />}>
        <View style={{ gap: 4 }}><Text variant="headlineLg">Progresso do trabalho</Text><Text variant="bodySm" color={colors.onSurfaceVariant}>Resumo dos teus projectos e tarefas.</Text></View>
        {busy ? <LoadingState /> : null}
        {error ? <ErrorState message="Não foi possível carregar as estatísticas." onRetry={refresh} /> : null}
        {taskCounts ? <View style={{ flexDirection: 'row', gap: 10 }}>
          <Metric icon="folder-open" value={projects.data?.counts.active ?? 0} label="Projectos activos" />
          <Metric icon="pending-actions" value={taskCounts.pending} label="Tarefas pendentes" />
          <Metric icon="task-alt" value={taskCounts.completed} label="Concluídas" />
        </View> : null}
        {projectItems.map((project) => <Card key={project.id} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name="folder-open" color={colors.secondary} /><Text variant="labelLg" style={{ flex: 1 }} numberOfLines={1}>{project.title}</Text><Text variant="labelLg" color={colors.secondary}>{project.progress.percent}%</Text></View>
          <ProgressBar percent={project.progress.percent} color={colors.secondary} />
          <Text variant="bodySm" color={colors.onSurfaceVariant}>{project.progress.done} de {project.progress.total} tarefas concluídas</Text>
        </Card>)}
      </ScrollView>
    </View>
  );
}

function Metric({ icon, value, label }: { icon: React.ComponentProps<typeof Icon>['name']; value: number; label: string }) {
  return <Card padding={12} style={{ flex: 1, gap: 8 }}><Icon name={icon} color={colors.secondary} /><Text variant="displaySm">{value}</Text><Text variant="labelSm" color={colors.onSurfaceVariant}>{label}</Text></Card>;
}

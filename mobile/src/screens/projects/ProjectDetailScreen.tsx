import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '@/api/client';
import { useDeleteProject, useProject, useRemoveMember, useSetTaskStatus, useTasks, useUpdateProject } from '@/api/hooks';
import type { ProjectStatus, TaskStatus } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { BottomSheet } from '@/components/BottomSheet';
import { DetailHeader } from '@/components/headers';
import { Icon, IconName } from '@/components/Icon';
import { Avatar, Badge, Button, Card, Chip, ChipRow, EmptyState, ErrorState, IconButton, LoadingState, ProgressBar } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { TaskCard } from '@/components/cards';
import { InviteSheet } from '@/features/projects/ProjectSheets';
import { TaskFormSheet } from '@/features/tasks/TaskFormSheet';
import { colors, radius, shadow, spacing } from '@/theme';
import { daysLeftLabel, formatDate } from '@/utils/format';
import { PROJECT_STATUS_LABEL } from '@/utils/labels';

type TaskFilter = 'ALL' | TaskStatus;

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const project = useProject(id);
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const tasks = useTasks({ projectId: id, status: filter === 'ALL' ? undefined : filter });
  const setStatus = useSetTaskStatus();
  const updateProject = useUpdateProject(id);
  const deleteProject = useDeleteProject();
  const removeMember = useRemoveMember(id);

  const [addingTask, setAddingTask] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!user) return <Redirect href="/login" />;

  const p = project.data;
  const isOwner = !!p && p.ownerId === user.id;
  const counts = tasks.data?.counts;
  const items = tasks.data?.items ?? [];

  const changeStatus = (status: ProjectStatus, message: string) => {
    setMenu(false);
    updateProject.mutate({ status }, { onSuccess: () => toast.show(message), onError: (e) => toast.show(getErrorMessage(e), 'error') });
  };

  const confirmDelete = () => {
    setMenu(false);
    Alert.alert('Eliminar projecto', 'Todas as tarefas e comentários deste projecto serão eliminados. Esta acção não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          deleteProject.mutate(id, {
            onSuccess: () => { toast.show('Projecto eliminado'); router.replace('/projects'); },
            onError: (e) => toast.show(getErrorMessage(e), 'error'),
          }),
      },
    ]);
  };

  const confirmRemove = (memberId: string, name: string) =>
    Alert.alert('Remover membro', `Remover ${name} do projecto? As tarefas dele ficam sem responsável.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeMember.mutate(memberId, { onError: (e) => toast.show(getErrorMessage(e), 'error') }) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeader
        title="Detalhes do Projecto"
        right={
          <>
            <IconButton icon="share" label="Partilhar projecto" size={38} bg={colors.surface} color={colors.onSurface} onPress={() => p && Share.share({ message: `${p.title} — ${p.progress.percent}% concluído (${p.progress.done}/${p.progress.total} tarefas)` })} />
            {isOwner ? <IconButton icon="more-vert" label="Mais opções" size={38} bg={colors.surface} color={colors.onSurface} onPress={() => setMenu(true)} /> : null}
          </>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 140 + insets.bottom, gap: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={project.isRefetching} onRefresh={() => { void project.refetch(); void tasks.refetch(); }} tintColor={colors.primaryContainer} />}
      >
        {project.isLoading ? <LoadingState /> : null}
        {project.isError ? <ErrorState message={getErrorMessage(project.error)} onRetry={() => project.refetch()} /> : null}

        {p ? (
          <>
            {/* Cartão do projecto */}
            <Card style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                {p.category ? <Badge label={p.category} /> : <View />}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.status === 'ACTIVE' ? colors.success : p.status === 'COMPLETED' ? colors.secondary : colors.neutral }} />
                  <Text variant="labelSm" color={colors.onSurfaceVariant}>{PROJECT_STATUS_LABEL[p.status]}</Text>
                </View>
              </View>
              <Text variant="displaySm">{p.title}</Text>
              {p.description ? <Text variant="bodyMd" color={colors.onSurfaceVariant} style={{ lineHeight: 22 }}>{p.description}</Text> : null}
              {p.sprint || p.location ? (
                <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                  {p.sprint ? <Meta icon="folder-special" label={p.sprint} /> : null}
                  {p.location ? <Meta icon="location-on" label={p.location} /> : null}
                </View>
              ) : null}
            </Card>

            {/* Progresso */}
            <View style={[styles.progress, shadow.float]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.progressIcon}>
                    <Icon name="insights" size={18} color={colors.secondaryFixed} />
                  </View>
                  <Text variant="headlineSm" color={colors.onPrimary}>Progresso Geral</Text>
                </View>
                <Text variant="displaySm" color={colors.secondaryFixed} style={{ fontFamily: 'Inter_700Bold' }}>{p.progress.percent}%</Text>
              </View>
              <ProgressBar percent={p.progress.percent} color={colors.secondaryFixed} track="rgba(255,255,255,0.15)" height={10} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={styles.tile}>
                  <Text variant="labelSm" color={colors.onPrimaryContainer}>Tarefas</Text>
                  <Text variant="headlineMd" color={colors.onPrimary}>{p.progress.done} <Text variant="bodySm" color={colors.onPrimaryContainer}>/ {p.progress.total}</Text></Text>
                  <Text variant="labelSm" color={colors.onPrimaryContainer}>{p.progress.percent}% concluído</Text>
                </View>
                <View style={styles.tile}>
                  <Text variant="labelSm" color={colors.onPrimaryContainer}>Prazo Final</Text>
                  <Text variant="headlineMd" color={colors.onPrimary}>{p.deadline ? formatDate(p.deadline) : '—'}</Text>
                  <Text variant="labelSm" color={colors.secondaryContainer}>{daysLeftLabel(p.daysLeft)}</Text>
                </View>
              </View>
            </View>

            {/* Equipa */}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text variant="headlineSm">Equipa do Projecto</Text>
                  <View style={styles.count}><Text variant="labelSm" color={colors.onSurfaceVariant}>{p.members.length}</Text></View>
                </View>
                {isOwner ? (
                  <Pressable onPress={() => setInviting(true)} style={styles.invite}>
                    <Icon name="person-add" size={16} color={colors.primaryContainer} />
                    <Text variant="labelMd" color={colors.primaryContainer}>Convidar membro</Text>
                  </Pressable>
                ) : null}
              </View>
              {p.members.map((m) => (
                <Card key={m.id} padding={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={m.name} uri={m.avatarUrl} size={44} online />
                  <View style={{ flex: 1 }}>
                    <Text variant="headlineSm">{m.name}</Text>
                    <Text variant="bodySm" color={colors.onSurfaceVariant}>{m.jobTitle ?? 'Membro'}</Text>
                  </View>
                  {m.role === 'OWNER' ? (
                    <Badge label="Líder" fg={colors.success} bg={colors.successBg} />
                  ) : isOwner ? (
                    <Pressable onPress={() => confirmRemove(m.id, m.name)} hitSlop={10} accessibilityLabel={`Remover ${m.name}`}>
                      <Icon name="person-remove" size={20} color={colors.outline} />
                    </Pressable>
                  ) : null}
                </Card>
              ))}
            </View>

            {/* Tarefas */}
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="headlineSm">Tarefas do Projecto</Text>
                <Text variant="labelMd" color={colors.onSurfaceVariant}>{items.length} {items.length === 1 ? 'tarefa' : 'tarefas'}</Text>
              </View>
              <ChipRow>
                <Chip label="Todas" count={counts?.all} active={filter === 'ALL'} onPress={() => setFilter('ALL')} />
                <Chip label="A Fazer" count={counts?.todo} active={filter === 'TODO'} onPress={() => setFilter('TODO')} />
                <Chip label="Em Progresso" count={counts?.inProgress} active={filter === 'IN_PROGRESS'} onPress={() => setFilter('IN_PROGRESS')} />
                {(counts?.inReview ?? 0) > 0 ? <Chip label="Em Revisão" count={counts?.inReview} active={filter === 'IN_REVIEW'} onPress={() => setFilter('IN_REVIEW')} /> : null}
                <Chip label="Concluídas" count={counts?.completed} active={filter === 'DONE'} onPress={() => setFilter('DONE')} />
              </ChipRow>

              {tasks.isLoading ? <LoadingState /> : null}
              {tasks.data && items.length === 0 ? <EmptyState icon="checklist-rtl" title="Sem tarefas aqui" text={isOwner ? 'Adicione a primeira tarefa deste projecto.' : 'Só o líder que criou o projecto pode adicionar uma nova tarefa.'} /> : null}
              {items.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  showProject={false}
                  onPress={() => router.push(`/task/${t.id}`)}
                  onToggle={() => setStatus.mutate({ id: t.id, status: t.status === 'DONE' ? 'TODO' : 'DONE' }, { onError: (e) => toast.show(getErrorMessage(e), 'error') })}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {p ? (
        <View pointerEvents="box-none" style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable onPress={() => isOwner ? setAddingTask(true) : Alert.alert('Adicionar tarefa', 'Só o líder que criou o projecto pode adicionar uma nova tarefa.')} style={({ pressed }) => [styles.addTask, shadow.float, pressed && { transform: [{ scale: 0.98 }] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="add-task" size={20} color={colors.onPrimary} />
              <Text variant="headlineSm" color={colors.onPrimary}>Adicionar Tarefa</Text>
            </View>
            <View style={styles.plus}><Icon name="add" size={18} color={colors.onPrimary} /></View>
          </Pressable>
        </View>
      ) : null}

      <TaskFormSheet visible={addingTask} onClose={() => setAddingTask(false)} projectId={id} />
      <InviteSheet visible={inviting} onClose={() => setInviting(false)} projectId={id} />

      {/* Opções (só o líder) */}
      <BottomSheet visible={menu} onClose={() => setMenu(false)} icon="more-horiz" title="Opções do projecto">
        {p?.status === 'ACTIVE' ? <MenuItem icon="check-circle" label="Marcar como concluído" onPress={() => changeStatus('COMPLETED', 'Projecto concluído')} /> : null}
        {p?.status !== 'ACTIVE' ? <MenuItem icon="restart-alt" label="Reactivar projecto" onPress={() => changeStatus('ACTIVE', 'Projecto reactivado')} /> : null}
        {p?.status !== 'ARCHIVED' ? <MenuItem icon="archive" label="Arquivar projecto" onPress={() => changeStatus('ARCHIVED', 'Projecto arquivado')} /> : null}
        <MenuItem icon="delete-outline" label="Eliminar projecto" danger onPress={confirmDelete} />
        <Button label="Cancelar" variant="secondary" onPress={() => setMenu(false)} />
      </BottomSheet>
    </View>
  );
}

function Meta({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={16} color={colors.secondary} />
      <Text variant="labelMd" color={colors.onSurfaceVariant}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.xl, backgroundColor: danger ? colors.dangerBg : colors.surfaceLow }}>
      <Icon name={icon} size={22} color={danger ? colors.danger : colors.onSurface} />
      <Text variant="headlineSm" color={danger ? colors.danger : colors.onSurface} style={{ fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progress: { backgroundColor: colors.primaryContainer, borderRadius: radius.xl, padding: 16, gap: 14 },
  progressIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  tile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.lg, padding: 10, gap: 2 },
  count: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.infoBg },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.screen },
  addTask: { height: 54, paddingHorizontal: 24, borderRadius: radius.full, backgroundColor: colors.primaryContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plus: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Project, Task } from '@/api/types';
import { Avatar, AvatarStack, Badge, Card, ProgressBar } from '@/components/primitives';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { colors, radius } from '@/theme';
import { daysLeftLabel, formatDate, shortName } from '@/utils/format';
import { PRIORITY_COLOR, PRIORITY_LABEL, PROJECT_STATUS_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/utils/labels';

// ------------------------------------------------------------------ Projecto
export function ProjectCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const done = project.status === 'COMPLETED';
  const barColor = done ? colors.success : project.progress.percent >= 70 ? colors.primaryContainer : colors.secondary;

  return (
    <Card onPress={onPress} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1, gap: 8 }}>
          {done ? (
            <Badge label={PROJECT_STATUS_LABEL.COMPLETED} icon="check-circle" fg={colors.success} bg={colors.successBg} />
          ) : project.status === 'ARCHIVED' ? (
            <Badge label={PROJECT_STATUS_LABEL.ARCHIVED} icon="archive" fg={colors.neutral} bg={colors.neutralBg} />
          ) : (
            <Badge label="Em progresso" dot={colors.secondary} />
          )}
          <Text variant="headlineSm" numberOfLines={1}>{project.title}</Text>
        </View>
      </View>

      {project.description ? (
        <Text variant="bodyMd" color={colors.onSurfaceVariant} numberOfLines={2}>{project.description}</Text>
      ) : null}

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="labelMd" color={colors.onSurfaceVariant}>
            {project.progress.done}/{project.progress.total} tarefas concluídas
          </Text>
          <Text variant="labelLg" color={barColor}>{project.progress.percent}%</Text>
        </View>
        <ProgressBar percent={project.progress.percent} color={barColor} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="event" size={16} color={colors.secondary} />
          <Text variant="bodySm" color={colors.onSurfaceVariant}>
            {project.deadline ? (
              <>Prazo: <Text variant="labelLg" color={colors.onSurface}>{formatDate(project.deadline)}</Text></>
            ) : 'Sem prazo definido'}
          </Text>
        </View>
        <AvatarStack people={project.members} />
      </View>
    </Card>
  );
}

// ------------------------------------------------------------------ Tarefa
export function TaskCard({ task, onPress, onToggle, showProject = true }: {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
  showProject?: boolean;
}) {
  const done = task.status === 'DONE';
  const pr = PRIORITY_COLOR[task.priority];
  const st = STATUS_COLOR[task.status];

  return (
    <Card onPress={onPress} style={[{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, done && { opacity: 0.8 }]}>
      <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={done ? 'Reabrir tarefa' : 'Concluir tarefa'}
        style={[styles.check, done ? { backgroundColor: colors.primaryContainer } : { backgroundColor: colors.surfaceHigh }]}>
        {done ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
      </Pressable>

      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {showProject ? <Badge label={task.project.title} bg={done ? colors.surface : 'rgba(209,228,255,0.6)'} fg={done ? colors.onSurfaceVariant : colors.onSecondaryFixed} /> : null}
          <Badge label={PRIORITY_LABEL[task.priority]} dot={pr.dot} fg={pr.fg} bg={pr.bg} />
          <Badge label={STATUS_LABEL[task.status]} fg={st.fg} bg={st.bg} />
        </View>

        <Text variant="headlineSm" numberOfLines={2} color={done ? colors.onSurfaceVariant : colors.onSurface} style={done ? { textDecorationLine: 'line-through' } : undefined}>
          {task.title}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
            {task.assignee ? <Avatar name={task.assignee.name} uri={task.assignee.avatarUrl} size={24} /> : <Icon name="person-outline" size={22} color={colors.outline} />}
            <Text variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={1}>{task.assignee ? shortName(task.assignee.name) : 'Sem responsável'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name={done ? 'done-all' : task.isOverdue ? 'schedule' : 'calendar-today'} size={15} color={task.isOverdue ? colors.error : colors.onSurfaceVariant} />
            <Text variant="labelSm" color={task.isOverdue ? colors.error : colors.onSurfaceVariant}>
              {done ? formatDate(task.completedAt) : task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

export { daysLeftLabel };

const styles = StyleSheet.create({
  check: { width: 26, height: 26, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});

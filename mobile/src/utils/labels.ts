import { colors } from '@/theme';
import type { Priority, ProjectStatus, TaskStatus } from '@/api/types';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em progresso',
  IN_REVIEW: 'Em revisão',
  DONE: 'Concluída',
};

export const STATUS_COLOR: Record<TaskStatus, { fg: string; bg: string }> = {
  TODO: { fg: colors.warning, bg: colors.warningBg },
  IN_PROGRESS: { fg: colors.info, bg: colors.infoBg },
  IN_REVIEW: { fg: colors.neutral, bg: colors.neutralBg },
  DONE: { fg: colors.success, bg: colors.successBg },
};

export const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export const PRIORITY_LABEL: Record<Priority, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' };

export const PRIORITY_COLOR: Record<Priority, { fg: string; bg: string; dot: string }> = {
  LOW: { fg: colors.onSurfaceVariant, bg: colors.surface, dot: colors.outline },
  MEDIUM: { fg: colors.onSecondaryFixed, bg: colors.secondaryFixed, dot: colors.secondary },
  HIGH: { fg: colors.onErrorContainer, bg: colors.errorContainer, dot: colors.error },
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: 'Activo',
  COMPLETED: 'Concluído',
  ARCHIVED: 'Arquivado',
};

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  AppNotification, Comment, DashboardHome, Me, Priority, Project, ProjectStatus, ProjectsResponse,
  Task, TaskStatus, TasksResponse, UserSearchResult,
} from './types';

// ------------------------------------------------------------------ helpers
const get = async <T,>(url: string, params?: object) => (await api.get<T>(url, { params })).data;

/** Qualquer alteração a tarefas/projectos pode afectar várias listas: refaz as consultas relacionadas. */
function useInvalidateWork() {
  const qc = useQueryClient();
  return () => {
    // A gravação já terminou; actualiza as listas em segundo plano para não
    // manter o modal bloqueado enquanto vários ecrãs fazem novo pedido à API.
    for (const key of ['dashboard', 'projects', 'project', 'tasks', 'task']) {
      void qc.invalidateQueries({ queryKey: [key] });
    }
  };
}

// ------------------------------------------------------------------ consultas
export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => get<DashboardHome>('/dashboard/home') });

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => get<Me>('/users/me') });

export interface ProjectFilters { status?: ProjectStatus; search?: string }
export const useProjects = (filters: ProjectFilters) =>
  useQuery({
    queryKey: ['projects', filters],
    queryFn: () => get<ProjectsResponse>('/projects', filters),
    placeholderData: keepPreviousData,
  });

export const useProject = (id: string) => useQuery({ queryKey: ['project', id], queryFn: () => get<Project>(`/projects/${id}`), enabled: !!id });

export interface TaskFilters {
  projectId?: string;
  state?: 'pending' | 'completed';
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
}
export const useTasks = (filters: TaskFilters) =>
  useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => get<TasksResponse>('/tasks', filters),
    placeholderData: keepPreviousData,
  });

export const useTask = (id: string) => useQuery({ queryKey: ['task', id], queryFn: () => get<Task>(`/tasks/${id}`) });

export const useComments = (taskId: string) =>
  useQuery({ queryKey: ['comments', taskId], queryFn: () => get<Comment[]>(`/tasks/${taskId}/comments`) });

export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: () => get<AppNotification[]>('/notifications') });

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 60_000,
  });

export const useUserSearch = (q: string) =>
  useQuery({
    queryKey: ['user-search', q],
    queryFn: () => get<UserSearchResult[]>('/users/search', { q }),
    enabled: q.trim().length >= 2,
  });

// ------------------------------------------------------------------ tarefas
export interface TaskInput {
  projectId?: string;
  title: string;
  description?: string;
  tag?: string;
  assigneeId?: string | null;
  priority?: Priority;
  dueDate?: string | null;
}

export function useCreateTask() {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async (input: TaskInput) => (await api.post<Task>('/tasks', input)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateTask(id: string) {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async (input: Partial<Omit<TaskInput, 'projectId'>> & { status?: TaskStatus }) =>
      (await api.patch<Task>(`/tasks/${id}`, input)).data,
    onSuccess: invalidate,
  });
}

export function useSetTaskStatus() {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) =>
      (await api.patch<Task>(`/tasks/${id}/status`, { status })).data,
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/tasks/${id}`)).data,
    onSuccess: invalidate,
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => (await api.post<Comment>(`/tasks/${taskId}/comments`, { text })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

// ------------------------------------------------------------------ projectos
export interface ProjectInput {
  title: string;
  description?: string;
  priority?: Priority;
  deadline?: string;
  memberIds?: string[];
}

export function useCreateProject() {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async (input: ProjectInput) => (await api.post<Project>('/projects', input)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateProject(id: string) {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async (input: Partial<Omit<ProjectInput, 'memberIds'>> & { status?: ProjectStatus }) =>
      (await api.patch<Project>(`/projects/${id}`, input)).data,
    onSuccess: invalidate,
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/projects/${id}`)).data,
    onSuccess: invalidate,
  });
}

export function useAddMember(projectId: string) {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async (input: { email: string; jobTitle?: string }) =>
      (await api.post<Project>(`/projects/${projectId}/members`, input)).data,
    onSuccess: invalidate,
  });
}

export function useRemoveMember(projectId: string) {
  const invalidate = useInvalidateWork();
  return useMutation({
    mutationFn: async (memberId: string) => (await api.delete(`/projects/${projectId}/members/${memberId}`)).data,
    onSuccess: invalidate,
  });
}

// ------------------------------------------------------------------ perfil
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name?: string; jobTitle?: string; city?: string; avatarUrl?: string }) => (await api.patch('/users/me', input)).data,
    onSuccess: () => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: ['me'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pushEnabled?: boolean; deadlineRemindersEnabled?: boolean; language?: string }) =>
      (await api.patch('/users/me/settings', input)).data,
    onMutate: async (input) => {
      // actualização optimista dos interruptores
      await qc.cancelQueries({ queryKey: ['me'] });
      const previous = qc.getQueryData<Me>(['me']);
      if (previous) qc.setQueryData<Me>(['me'], { ...previous, ...input });
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(['me'], ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => (await api.post('/users/me/password', input)).data,
  });

// ------------------------------------------------------------------ notificações
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.patch('/notifications/read-all')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

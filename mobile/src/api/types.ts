/** Tipos que espelham as respostas da API (projetoemdia/api). Datas chegam como string ISO. */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type ProjectRole = 'OWNER' | 'MEMBER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  city: string | null;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface Me extends AuthUser {
  pushEnabled: boolean;
  deadlineRemindersEnabled: boolean;
  language: string;
  createdAt: string;
  stats: { projectsTotal: number; delivered: number; onTimePercent: number };
}

export interface Progress {
  total: number;
  done: number;
  percent: number;
}

export interface ProjectMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role?: ProjectRole;
  jobTitle?: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  client: string | null;
  location: string | null;
  sprint: string | null;
  status: ProjectStatus;
  priority: Priority;
  deadline: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  progress: Progress;
  daysLeft: number | null;
  members: ProjectMember[];
}

export interface ProjectsResponse {
  items: Project[];
  counts: { all: number; active: number; completed: number; archived: number };
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string | null;
  tag: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  completedAt: string | null;
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  project: { id: string; title: string };
  assignee: { id: string; name: string; avatarUrl: string | null; jobTitle: string | null } | null;
  createdBy: { id: string; name: string };
  commentsCount: number;
  isOverdue: boolean;
}

export interface TasksResponse {
  items: Task[];
  counts: { all: number; pending: number; todo: number; inProgress: number; inReview: number; completed: number };
}

export interface Comment {
  id: string;
  text: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_COMMENTED' | 'PROJECT_INVITE' | 'DEADLINE_REMINDER';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: { taskId?: string; projectId?: string } | null;
  read: boolean;
  createdAt: string;
}

export interface DashboardHome {
  user: { id: string; name: string; avatarUrl: string | null; city: string | null } | null;
  highlight: {
    id: string;
    title: string;
    priority: Priority;
    status: TaskStatus;
    dueDate: string | null;
    project: { id: string; title: string };
    projectProgressPercent: number;
  } | null;
  summary: { activeProjects: number; pendingTasks: number; doneThisWeek: number; doneDeltaPercent: number };
  recentProjects: (Omit<Project, 'members'> & { members: ProjectMember[] })[];
  todayTasks: {
    id: string;
    title: string;
    tag: string | null;
    status: TaskStatus;
    priority: Priority;
    dueDate: string | null;
    completedAt: string | null;
    project: { id: string; title: string };
  }[];
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
}

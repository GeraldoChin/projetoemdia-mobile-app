import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

const TASK_INCLUDE = {
  project: { select: { id: true, title: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true, jobTitle: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof TASK_INCLUDE }>;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------------------------------------------------------- listagem
  async findAll(userId: string, query: QueryTasksDto) {
    // Base: projecto inteiro (se for membro) ou só as minhas tarefas
    let base: Prisma.TaskWhereInput;
    if (query.projectId) {
      await this.projects.assertMember(query.projectId, userId);
      base = { projectId: query.projectId };
    } else {
      base = { assigneeId: userId };
    }

    const search = query.search?.trim();
    const where: Prisma.TaskWhereInput = {
      ...base,
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.state === 'pending' ? { status: { not: 'DONE' } } : {}),
      ...(query.state === 'completed' ? { status: 'DONE' } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [tasks, grouped] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
      }),
      // contadores dos filtros (só dependem da base, não dos filtros aplicados)
      this.prisma.task.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
    ]);

    const count = (s: TaskStatus) => grouped.find((g) => g.status === s)?._count._all ?? 0;
    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

    return {
      items: tasks.map((t) => this.toDto(t)),
      counts: {
        all: total,
        pending: total - count('DONE'),
        todo: count('TODO'),
        inProgress: count('IN_PROGRESS'),
        inReview: count('IN_REVIEW'),
        completed: count('DONE'),
      },
    };
  }

  async findOne(userId: string, taskId: string) {
    const task = await this.getAccessibleTask(taskId, userId);
    return this.toDto(task);
  }

  // ---------------------------------------------------------------- escrita
  async create(userId: string, dto: CreateTaskDto) {
    await this.projects.assertCreator(dto.projectId, userId);
    if (dto.assigneeId) await this.projects.assertMember(dto.projectId, dto.assigneeId).catch(() => {
      throw new BadRequestException('O responsável tem de ser membro do projecto');
    });

    const { dueDate, ...data } = dto;
    const task = await this.prisma.task.create({
      data: {
        ...data,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdById: userId,
      },
      include: TASK_INCLUDE,
    });

    await this.notifyAssigned(task, userId);
    return this.toDto(task);
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const current = await this.getAccessibleTask(taskId, userId);

    if (dto.assigneeId) {
      await this.projects.assertMember(current.projectId, dto.assigneeId).catch(() => {
        throw new BadRequestException('O responsável tem de ser membro do projecto');
      });
    }

    const { dueDate, status, ...rest } = dto;
    const data: Prisma.TaskUncheckedUpdateInput = { ...rest };
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (status) Object.assign(data, this.statusData(status));

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data,
      include: TASK_INCLUDE,
    });

    if (dto.assigneeId && dto.assigneeId !== current.assigneeId) {
      await this.notifyAssigned(task, userId);
    }
    return this.toDto(task);
  }

  async updateStatus(userId: string, taskId: string, status: TaskStatus) {
    await this.getAccessibleTask(taskId, userId);
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: this.statusData(status),
      include: TASK_INCLUDE,
    });
    return this.toDto(task);
  }

  async remove(userId: string, taskId: string) {
    const task = await this.getAccessibleTask(taskId, userId);
    if (task.createdById !== userId) {
      await this.projects.assertOwner(task.projectId, userId).catch(() => {
        throw new ForbiddenException('Só o criador da tarefa ou o líder do projecto a podem eliminar');
      });
    }
    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Tarefa eliminada' };
  }

  // ---------------------------------------------------------------- helpers
  /** Carrega a tarefa e garante que o utilizador pertence ao projecto dela. */
  private async getAccessibleTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId }, include: TASK_INCLUDE });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    await this.projects.assertMember(task.projectId, userId);
    return task;
  }

  private statusData(status: TaskStatus): Prisma.TaskUncheckedUpdateInput {
    return { status, completedAt: status === 'DONE' ? new Date() : null };
  }

  private async notifyAssigned(task: TaskWithRelations, actorId: string) {
    if (!task.assigneeId || task.assigneeId === actorId) return;
    await this.notifications.create({
      userId: task.assigneeId,
      type: 'TASK_ASSIGNED',
      title: 'Nova tarefa atribuída',
      body: task.title,
      data: { taskId: task.id, projectId: task.projectId },
    });
  }

  private toDto(task: TaskWithRelations) {
    const { _count, number, ...rest } = task;
    return {
      ...rest,
      code: `MP-${number}`,
      commentsCount: _count.comments,
      isOverdue: !!task.dueDate && task.status !== 'DONE' && task.dueDate.getTime() < Date.now(),
    };
  }
}

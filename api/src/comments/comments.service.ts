import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';

const AUTHOR_SELECT = { select: { id: true, name: true, avatarUrl: true } } as const;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string, taskId: string) {
    await this.getTaskForMember(taskId, userId);
    return this.prisma.comment.findMany({
      where: { taskId },
      include: { author: AUTHOR_SELECT },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
    const task = await this.getTaskForMember(taskId, userId);

    const comment = await this.prisma.comment.create({
      data: { taskId, authorId: userId, text: dto.text.trim() },
      include: { author: AUTHOR_SELECT },
    });

    // Avisa o responsável e o criador da tarefa (sem se auto-notificar)
    const targets = new Set([task.assigneeId, task.createdById].filter((id): id is string => !!id && id !== userId));
    await Promise.all(
      [...targets].map((id) =>
        this.notifications.create({
          userId: id,
          type: 'TASK_COMMENTED',
          title: `${comment.author.name} comentou numa tarefa`,
          body: task.title,
          data: { taskId, projectId: task.projectId },
        }),
      ),
    );

    return comment;
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.authorId !== userId) throw new ForbiddenException('Só pode apagar os seus comentários');
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Comentário eliminado' };
  }

  private async getTaskForMember(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    await this.projects.assertMember(task.projectId, userId);
    return task;
  }
}

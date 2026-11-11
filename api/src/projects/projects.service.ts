import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { AddMemberDto } from './dto/add-member.dto';

const MEMBERS_INCLUDE = {
  members: {
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { joinedAt: 'asc' },
  },
} satisfies Prisma.ProjectInclude;

type ProjectWithMembers = Prisma.ProjectGetPayload<{ include: typeof MEMBERS_INCLUDE }>;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------------------------------------------------------- listagem
  async findAll(userId: string, query: QueryProjectsDto) {
    const where: Prisma.ProjectWhereInput = {
      members: { some: { userId } },
      ...(query.status ? { status: query.status } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
              { tasks: { some: { title: { contains: query.search.trim(), mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [projects, grouped] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: MEMBERS_INCLUDE,
        orderBy: { updatedAt: 'desc' },
      }),
      // contadores dos chips (ignoram o filtro de estado e a pesquisa)
      this.prisma.project.groupBy({
        by: ['status'],
        where: { members: { some: { userId } } },
        _count: { _all: true },
      }),
    ]);

    const progress = await this.progressFor(projects.map((p) => p.id));
    const count = (s: ProjectStatus) => grouped.find((g) => g.status === s)?._count._all ?? 0;

    return {
      items: projects.map((p) => this.toDto(p, progress.get(p.id))),
      counts: {
        all: grouped.reduce((sum, g) => sum + g._count._all, 0),
        active: count('ACTIVE'),
        completed: count('COMPLETED'),
        archived: count('ARCHIVED'),
      },
    };
  }

  async findOne(userId: string, projectId: string) {
    await this.assertMember(projectId, userId);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: MEMBERS_INCLUDE,
    });
    if (!project) throw new NotFoundException('Projecto não encontrado');
    const progress = await this.progressFor([projectId]);
    return this.toDto(project, progress.get(projectId));
  }

  // ---------------------------------------------------------------- escrita
  async create(userId: string, dto: CreateProjectDto) {
    const { memberIds = [], deadline, ...data } = dto;
    const others = memberIds.filter((id) => id !== userId);

    if (others.length) {
      const found = await this.prisma.user.count({ where: { id: { in: others } } });
      if (found !== others.length) throw new BadRequestException('Um ou mais membros não existem');
    }

    const project = await this.prisma.project.create({
      data: {
        ...data,
        deadline: deadline ? new Date(deadline) : undefined,
        ownerId: userId,
        members: {
          create: [
            { userId, role: 'OWNER', jobTitle: 'Líder' },
            ...others.map((id) => ({ userId: id })),
          ],
        },
      },
      include: MEMBERS_INCLUDE,
    });

    await Promise.all(
      others.map((id) =>
        this.notifications.create({
          userId: id,
          type: 'PROJECT_INVITE',
          title: 'Foi adicionado a um projecto',
          body: project.title,
          data: { projectId: project.id },
        }),
      ),
    );

    return this.toDto(project, { total: 0, done: 0 });
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    await this.assertOwner(projectId, userId);
    const { deadline, ...data } = dto;
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { ...data, ...(deadline ? { deadline: new Date(deadline) } : {}) },
      include: MEMBERS_INCLUDE,
    });
    const progress = await this.progressFor([projectId]);
    return this.toDto(project, progress.get(projectId));
  }

  async remove(userId: string, projectId: string) {
    await this.assertOwner(projectId, userId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { message: 'Projecto eliminado' };
  }

  // ---------------------------------------------------------------- membros
  async addMember(userId: string, projectId: string, dto: AddMemberDto) {
    await this.assertOwner(projectId, userId);

    const invited = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!invited) throw new NotFoundException('Não existe nenhum utilizador com esse email');

    const already = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: invited.id } },
    });
    if (already) throw new BadRequestException('Este utilizador já faz parte do projecto');

    await this.prisma.projectMember.create({
      data: { projectId, userId: invited.id, jobTitle: dto.jobTitle },
    });

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    await this.notifications.create({
      userId: invited.id,
      type: 'PROJECT_INVITE',
      title: 'Foi adicionado a um projecto',
      body: project?.title,
      data: { projectId },
    });

    return this.findOne(userId, projectId);
  }

  async removeMember(userId: string, projectId: string, memberId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projecto não encontrado');
    await this.assertMember(projectId, userId);

    if (memberId === project.ownerId) {
      throw new BadRequestException('O líder do projecto não pode ser removido');
    }
    if (userId !== project.ownerId && userId !== memberId) {
      throw new ForbiddenException('Só o líder pode remover outros membros');
    }

    await this.prisma.$transaction([
      // as tarefas do membro ficam sem responsável
      this.prisma.task.updateMany({
        where: { projectId, assigneeId: memberId },
        data: { assigneeId: null },
      }),
      this.prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId: memberId } },
      }),
    ]);
    return { message: 'Membro removido' };
  }

  // ---------------------------------------------------------------- acesso (usado por Tasks/Comments)
  async assertMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) {
      const exists = await this.prisma.project.count({ where: { id: projectId } });
      if (!exists) throw new NotFoundException('Projecto não encontrado');
      throw new ForbiddenException('Não faz parte deste projecto');
    }
    return member;
  }

  async assertOwner(projectId: string, userId: string) {
    const member = await this.assertMember(projectId, userId);
    if (member.role !== 'OWNER') throw new ForbiddenException('Apenas o líder do projecto pode fazer isto');
  }

  async assertCreator(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project) throw new NotFoundException('Projecto não encontrado');
    if (project.ownerId !== userId) throw new ForbiddenException('Só o líder que criou o projecto pode adicionar uma nova tarefa');
  }

  // ---------------------------------------------------------------- helpers
  /** Total e concluídas por projecto (progresso é sempre calculado, nunca guardado). */
  private async progressFor(projectIds: string[]) {
    const map = new Map<string, { total: number; done: number }>();
    if (!projectIds.length) return map;

    const rows = await this.prisma.task.groupBy({
      by: ['projectId', 'status'],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    });
    for (const r of rows) {
      const entry = map.get(r.projectId) ?? { total: 0, done: 0 };
      entry.total += r._count._all;
      if (r.status === ('DONE' as TaskStatus)) entry.done += r._count._all;
      map.set(r.projectId, entry);
    }
    return map;
  }

  private toDto(project: ProjectWithMembers, progress: { total: number; done: number } = { total: 0, done: 0 }) {
    const { members, ...rest } = project;
    const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    const daysLeft = project.deadline
      ? Math.ceil((project.deadline.getTime() - Date.now()) / 86_400_000)
      : null;

    return {
      ...rest,
      progress: { total: progress.total, done: progress.done, percent },
      daysLeft,
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        jobTitle: m.jobTitle,
      })),
    };
  }
}

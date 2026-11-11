import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MS_DAY = 86_400_000;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Tudo o que o ecrã "Início" precisa, numa só chamada. */
  async home(userId: string) {
    const { startOfToday, endOfToday, startOfWeek } = this.dayBoundaries();
    const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * MS_DAY);

    const mine: Prisma.TaskWhereInput = { assigneeId: userId };
    const notDone: Prisma.TaskWhereInput = { ...mine, status: { not: 'DONE' } };

    const [user, activeProjects, pendingTasks, doneThisWeek, doneLastWeek, highlight, recent, today] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, avatarUrl: true, city: true },
        }),
        this.prisma.project.count({
          where: { status: 'ACTIVE', members: { some: { userId } } },
        }),
        this.prisma.task.count({ where: notDone }),
        this.prisma.task.count({ where: { ...mine, status: 'DONE', completedAt: { gte: startOfWeek } } }),
        this.prisma.task.count({
          where: { ...mine, status: 'DONE', completedAt: { gte: startOfLastWeek, lt: startOfWeek } },
        }),
        // "Próxima entrega prioritária": alta prioridade primeiro, depois a mais próxima
        this.prisma.task.findFirst({
          where: notDone,
          orderBy: [{ priority: 'desc' }, { dueDate: { sort: 'asc', nulls: 'last' } }],
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            dueDate: true,
            project: { select: { id: true, title: true } },
          },
        }),
        this.prisma.project.findMany({
          where: { status: 'ACTIVE', members: { some: { userId } } },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          include: {
            members: {
              take: 4,
              orderBy: { joinedAt: 'asc' },
              include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            },
          },
        }),
        // "Tarefas para Hoje": prazo hoje, ou concluídas hoje
        this.prisma.task.findMany({
          where: {
            ...mine,
            OR: [
              { dueDate: { gte: startOfToday, lt: endOfToday } },
              { status: 'DONE', completedAt: { gte: startOfToday, lt: endOfToday } },
            ],
          },
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
          select: {
            id: true,
            title: true,
            tag: true,
            status: true,
            priority: true,
            dueDate: true,
            completedAt: true,
            project: { select: { id: true, title: true } },
          },
        }),
      ]);

    // progresso (%) do projecto da tarefa em destaque + dos projectos recentes
    const projectIds = [...new Set([...(highlight ? [highlight.project.id] : []), ...recent.map((p) => p.id)])];
    const progress = await this.progressFor(projectIds);

    return {
      user,
      highlight: highlight
        ? { ...highlight, projectProgressPercent: progress.get(highlight.project.id)?.percent ?? 0 }
        : null,
      summary: {
        activeProjects,
        pendingTasks,
        doneThisWeek,
        // variação face à semana anterior (ex.: +15)
        doneDeltaPercent: doneLastWeek
          ? Math.round(((doneThisWeek - doneLastWeek) / doneLastWeek) * 100)
          : doneThisWeek
            ? 100
            : 0,
      },
      recentProjects: recent.map((p) => {
        const { members, ...rest } = p;
        const pr = progress.get(p.id) ?? { total: 0, done: 0, percent: 0 };
        return {
          ...rest,
          progress: pr,
          daysLeft: p.deadline ? Math.ceil((p.deadline.getTime() - Date.now()) / MS_DAY) : null,
          members: members.map((m) => ({ id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl })),
        };
      }),
      todayTasks: today,
    };
  }

  private async progressFor(projectIds: string[]) {
    const map = new Map<string, { total: number; done: number; percent: number }>();
    if (!projectIds.length) return map;

    const rows = await this.prisma.task.groupBy({
      by: ['projectId', 'status'],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    });
    for (const r of rows) {
      const e = map.get(r.projectId) ?? { total: 0, done: 0, percent: 0 };
      e.total += r._count._all;
      if (r.status === 'DONE') e.done += r._count._all;
      e.percent = e.total ? Math.round((e.done / e.total) * 100) : 0;
      map.set(r.projectId, e);
    }
    return map;
  }

  /** Limites de "hoje" e "esta semana" (segunda-feira) no fuso do utilizador (Maputo = UTC+2). */
  private dayBoundaries() {
    const offsetMin = Number(this.config.get('APP_UTC_OFFSET_MINUTES') ?? 120);
    const local = new Date(Date.now() + offsetMin * 60_000);
    const startLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
    const toUtc = (ms: number) => new Date(ms - offsetMin * 60_000);

    const dayOfWeek = (local.getUTCDay() + 6) % 7; // segunda = 0
    return {
      startOfToday: toUtc(startLocal),
      endOfToday: toUtc(startLocal + MS_DAY),
      startOfWeek: toUtc(startLocal - dayOfWeek * MS_DAY),
    };
  }
}

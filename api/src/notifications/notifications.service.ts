import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria uma notificação. (Envio de push via Expo pode ser ligado aqui mais tarde.) */
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Prisma.InputJsonValue;
  }) {
    return this.prisma.notification.create({ data: params });
  }

  list(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }

  async markRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    if (result.count === 0) throw new NotFoundException('Notificação não encontrada');
    return { message: 'Notificação marcada como lida' };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }
}

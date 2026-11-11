import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  jobTitle: true,
  city: true,
  avatarUrl: true,
  pushEnabled: true,
  deadlineRemindersEnabled: true,
  language: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Perfil + estatísticas do ecrã "Perfil". */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return { ...user, stats: await this.getStats(userId) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PROFILE_SELECT,
    });
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PROFILE_SELECT,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('A palavra-passe actual está incorrecta');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 10),
        refreshTokenHash: null, // força novo login nos outros dispositivos
      },
    });
    return { message: 'Palavra-passe alterada com sucesso' };
  }

  async registerPushToken(userId: string, token: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { pushToken: token } });
    return { message: 'Token registado' };
  }

  /** Pesquisa para convidar pessoas (nome ou email). */
  search(query: string, excludeUserId: string) {
    const q = query.trim();
    if (q.length < 2) return [];
    return this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true },
      take: 10,
    });
  }

  /** Projectos Totais, % No Prazo, Entregues. */
  private async getStats(userId: string) {
    const [projectsTotal, doneTasks] = await Promise.all([
      this.prisma.projectMember.count({ where: { userId } }),
      this.prisma.task.findMany({
        where: { assigneeId: userId, status: 'DONE' },
        select: { dueDate: true, completedAt: true },
      }),
    ]);

    const withDeadline = doneTasks.filter((t) => t.dueDate && t.completedAt);
    const onTime = withDeadline.filter((t) => t.completedAt! <= t.dueDate!).length;

    return {
      projectsTotal,
      delivered: doneTasks.length,
      onTimePercent: withDeadline.length ? Math.round((onTime / withDeadline.length) * 100) : 100,
    };
  }
}

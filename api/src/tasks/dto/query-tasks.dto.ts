import { ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryTasksDto {
  @ApiPropertyOptional({
    description: 'Se enviado, devolve TODAS as tarefas do projecto (membro). Se não, só as tarefas atribuídas ao utilizador.',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'completed'], description: 'Filtro segmentado: Pendentes / Concluídas' })
  @IsOptional()
  @IsIn(['pending', 'completed'])
  state?: 'pending' | 'completed';

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Estado exacto (A Fazer, Em Progresso, ...)' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

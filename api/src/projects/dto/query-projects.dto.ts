import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryProjectsDto {
  @ApiPropertyOptional({ enum: ProjectStatus, description: 'Filtro dos chips: Activos / Concluídos / Arquivo' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Pesquisa em título, descrição e tarefas' })
  @IsOptional()
  @IsString()
  search?: string;
}

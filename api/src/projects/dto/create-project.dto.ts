import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Campanha Digital M-Pesa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ example: 'Objectivos centrais, escopo e entregáveis principais...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'Design & Desenvolvimento UI/UX' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'Banco Comercial' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  client?: string;

  @ApiPropertyOptional({ example: 'Maputo / Remoto' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: 'Sprint 03 • Q2' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  sprint?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ example: '2026-12-30', description: 'Data de entrega (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de utilizadores a adicionar como membros' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}

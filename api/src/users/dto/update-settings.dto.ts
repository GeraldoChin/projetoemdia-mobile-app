import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  deadlineRemindersEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['pt-MZ', 'pt-PT', 'en'] })
  @IsOptional()
  @IsIn(['pt-MZ', 'pt-PT', 'en'])
  language?: string;
}

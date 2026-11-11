import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'edson.macuacua@empresa.co.mz' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Frontend Dev' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  jobTitle?: string;
}

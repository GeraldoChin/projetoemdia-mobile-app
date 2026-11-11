import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Documentação da API recebida e validada.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;
}

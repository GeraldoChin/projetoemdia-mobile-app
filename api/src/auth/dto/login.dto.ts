import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'samira.nguenha@empresa.co.mz' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Segredo123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

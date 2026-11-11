import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/** Converte erros conhecidos do Prisma em respostas HTTP legíveis. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Já existe um registo com estes dados';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Registo não encontrado';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Referência inválida para um registo relacionado';
        break;
    }

    res.status(status).json({ statusCode: status, message, error: exception.code });
  }
}

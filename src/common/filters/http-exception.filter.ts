import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type RequestWithContext = Request & {
  requestId?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    response.status(status).json({
      statusCode: status,
      message: this.getMessage(exceptionResponse),
      error: this.getErrorLabel(exceptionResponse, status),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      requestId: request.requestId ?? 'unknown',
    });
  }

  private getMessage(exceptionResponse: string | object | null) {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      return exceptionResponse.message;
    }

    return 'Internal server error';
  }

  private getErrorLabel(
    exceptionResponse: string | object | null,
    status: number,
  ) {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse &&
      typeof exceptionResponse.error === 'string'
    ) {
      return exceptionResponse.error;
    }

    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal Server Error'
      : 'Error';
  }
}

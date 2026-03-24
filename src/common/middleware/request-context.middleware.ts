import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

type RequestWithContext = Request & {
  requestId?: string;
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  use(request: RequestWithContext, response: Response, next: NextFunction) {
    const requestId = this.resolveRequestId(request);
    const startedAt = Date.now();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      this.logger.log(
        `[${requestId}] ${request.method} ${request.originalUrl} ${response.statusCode} ${duration}ms`,
      );
    });

    next();
  }

  private resolveRequestId(request: Request) {
    const headerValue = request.headers['x-request-id'];

    if (typeof headerValue === 'string' && headerValue.trim()) {
      return headerValue;
    }

    return randomUUID();
  }
}

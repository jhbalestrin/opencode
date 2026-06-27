import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { asRequestWithContext } from '../types/request-context';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const context = asRequestWithContext(req);
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const durationMs = Date.now() - context.requestStartedAt;
      this.logger.log(
        `[${context.requestId}] ${method} ${originalUrl} ${res.statusCode} ${durationMs}ms`,
      );
    });

    const originalEnd = res.end.bind(res) as Response['end'];
    res.end = ((...args: Parameters<Response['end']>) => {
      const durationMs = Date.now() - context.requestStartedAt;
      if (!res.headersSent) {
        res.setHeader('x-response-time-ms', String(durationMs));
      }
      return originalEnd(...args);
    }) as Response['end'];

    next();
  }
}

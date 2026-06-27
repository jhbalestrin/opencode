import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { asRequestWithContext } from '../types/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const context = asRequestWithContext(req);
    const incomingId = req.header('x-request-id');

    context.requestId =
      typeof incomingId === 'string' && incomingId.length > 0
        ? incomingId
        : randomUUID();
    context.requestStartedAt = Date.now();

    res.setHeader('x-request-id', context.requestId);
    next();
  }
}

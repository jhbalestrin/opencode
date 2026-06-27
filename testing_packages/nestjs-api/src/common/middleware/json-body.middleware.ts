import {
  Injectable,
  NestMiddleware,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (!BODY_METHODS.has(req.method)) {
      next();
      return;
    }

    const contentType = req.header('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new UnsupportedMediaTypeException(
        'Content-Type must be application/json',
      );
    }

    next();
  }
}

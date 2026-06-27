import { Request } from 'express';

export interface RequestWithContext extends Request {
  requestId: string;
  requestStartedAt: number;
}

export function asRequestWithContext(req: Request): RequestWithContext {
  return req as RequestWithContext;
}

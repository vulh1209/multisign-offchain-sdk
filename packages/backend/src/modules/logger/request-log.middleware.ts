import dayjs from 'dayjs';
import { NextFunction, Request, Response } from 'express';
import { Logger, NestMiddleware } from '@nestjs/common';

import { InjectLogger } from './logger.decorator';

type LogRequest = { method: string; path: string; ms: number; statusCode: number };

export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(@InjectLogger() private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = dayjs();
    res.on('close', () => {
      this.logRequest({
        method: req.method,
        path: req.path,
        ms: dayjs().diff(start, 'millisecond'),
        statusCode: res.statusCode,
      });
    });
    next();
  }

  logRequest({ method, path, ms, statusCode }: LogRequest) {
    (this.logger as any).logger.http(`${method} ${path} ${ms}ms ${statusCode}`);
  }
}

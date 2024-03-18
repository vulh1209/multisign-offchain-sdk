import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import AuthModule from '@modules/auth';
import HealthModule from '@modules/health';
import LoggerModule, { RequestLoggingMiddleware } from '@modules/logger';

@Module({
  imports: [LoggerModule, HealthModule, AuthModule.http()],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}

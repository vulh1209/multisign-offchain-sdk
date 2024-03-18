import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Global()
@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [HealthService],
})
export class HealthModule {}

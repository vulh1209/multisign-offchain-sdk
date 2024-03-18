import { Request } from 'express';
import { Controller, Get, Headers, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';

import { HealthCheckResult, HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @HealthCheck()
  @ApiOkResponse({ type: HealthCheckResult, description: 'The app is alive' })
  @Get()
  live() {
    return this.service.liveness();
  }

  @ApiOkResponse({ type: Boolean, description: 'The app is ready to serve' })
  @Get('/ready')
  ready() {
    return this.service.readiness();
  }

  @ApiOkResponse({ type: String, description: 'Pong' })
  @Get('/ping')
  ping(@Req() req: Request, @Headers('x-forwarded-for') ip?: string) {
    return req.ip || ip;
  }
}

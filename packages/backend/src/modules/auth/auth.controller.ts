import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthInfo, Authorized } from './auth.decorator';
import { IAuthInfo, RestGuard } from './rest.guard';
import { UserRole } from './roles';

@UseGuards(RestGuard)
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Authorized(UserRole.AUTHENTICATED)
  @ApiBearerAuth()
  @ApiOkResponse()
  @Get('/me')
  async me(@AuthInfo() authInfo: IAuthInfo) {
    return authInfo;
  }
}

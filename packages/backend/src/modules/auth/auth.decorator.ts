import {
  createParamDecorator,
  CustomDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

import { AuthRequest } from './rest.guard';

export const ROLES_KEY = 'AUTHORIZED_ROLES';

export const Authorized = (...roles: string[]): CustomDecorator => SetMetadata(ROLES_KEY, roles);

export const AuthInfo = createParamDecorator((_: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthRequest>();
  return request.authInfo;
});

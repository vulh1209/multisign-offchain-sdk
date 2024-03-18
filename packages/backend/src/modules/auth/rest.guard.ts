import { Request } from 'express';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { TokenInfo, TokenService } from '@modules/auth/token.service';

import { ROLES_KEY } from './auth.decorator';
import { UserRole } from './roles';
import { hasRole } from './utils';

export type IAuthInfo = TokenInfo & {
  roles?: string[];
};

export type AuthRequest = Request & {
  authInfo?: IAuthInfo;
};

@Injectable()
export class RestGuard implements CanActivate {
  private readonly logger = new Logger(RestGuard.name);

  constructor(private readonly reflector: Reflector, private readonly tokenSrv: TokenService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authInfo = await this.getAuthInfoFromRequest(request);

    const allowedRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!allowedRoles || allowedRoles.includes(UserRole.EVERYONE)) {
      return true;
    }

    if (!authInfo) throw new UnauthorizedException('Access denied', 'Unauthorized');

    return hasRole(authInfo.roles, allowedRoles);
  }

  private async getAuthInfoFromRequest(request: AuthRequest) {
    if (request.authInfo) {
      return request.authInfo;
    }

    let { authorization: token } = request.headers;
    if (!token) return null;

    // token may in form of "Bearer <token>"
    token = token.trim().split(' ').pop();

    let decoded: IAuthInfo = null;
    try {
      decoded = await this.tokenSrv.verify(token, 'id');
    } catch (e) {
      this.logger.error('Invalid or expired token');
      return decoded;
    }

    decoded.roles = [
      UserRole.EVERYONE,
      UserRole.AUTHENTICATED,
      ...(decoded['cognito:groups'] ?? []),
    ];

    request.authInfo = decoded;

    return decoded;
  }
}

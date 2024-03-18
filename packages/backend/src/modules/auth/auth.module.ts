import { DynamicModule, Global, Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { JwtVerifierProvider, TokenService } from './token.service';

@Global()
@Module({
  providers: [JwtVerifierProvider, TokenService],
  exports: [TokenService],
})
export class AuthModule {
  static http(): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      controllers: [AuthController],
    };
  }
}

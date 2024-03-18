import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type {
  CognitoJwtVerifierProperties,
  CognitoJwtVerifierSingleUserPool,
} from 'aws-jwt-verify/cognito-verifier';
import { SimpleJsonFetcher } from 'aws-jwt-verify/https';
import { SimpleJwksCache } from 'aws-jwt-verify/jwk';
import type { CognitoJwtPayload } from 'aws-jwt-verify/jwt-model';
import { Inject, Injectable, Provider } from '@nestjs/common';

import systemConfig from '@core/config/system';

export type ExternalIdentity = {
  userId: string;
  providerName: string;
  providerType: string;
  dateCreated: string;
};

export type TokenInfo = CognitoJwtPayload & {
  email: string;
  email_verified: boolean;
  'custom:user_id': string;
  'cognito:username': string;
  identities?: ExternalIdentity[];
};

export type Verifier = CognitoJwtVerifierSingleUserPool<CognitoJwtVerifierProperties>;

export const JWT_VERIFIER_TOKEN = Symbol('JWT_VERIFIER_TOKEN');

export const JwtVerifierProvider: Provider<Promise<Verifier>> = {
  provide: JWT_VERIFIER_TOKEN,
  useFactory: async () => {
    const cognito = await systemConfig.cognito;

    const fetcher = new SimpleJsonFetcher({
      defaultRequestOptions: { timeout: 3000, responseTimeout: 5000 },
    });
    const jwksCache = new SimpleJwksCache({ fetcher });
    const verifier = CognitoJwtVerifier.create(
      {
        userPoolId: cognito.userPoolId,
        clientId: null,
        tokenUse: null,
      },
      { jwksCache },
    );

    await verifier.hydrate();

    return verifier;
  },
};

@Injectable()
export class TokenService {
  constructor(@Inject(JWT_VERIFIER_TOKEN) private readonly jwtVerifier: Verifier) {}

  async verify(token: string, tokenUse: 'id' | 'access' = null): Promise<TokenInfo> {
    return this.jwtVerifier.verifySync(token, { tokenUse }) as TokenInfo;
  }
}

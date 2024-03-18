import '@env';

import ExpiryMap from 'expiry-map';
import memoize from 'fast-memoize';
import { zipObject } from 'lodash';
import { SSM } from '@aws-sdk/client-ssm';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { type AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { Injectable } from '@nestjs/common';

// add config keys here
export enum ConfigKey {
  AWS_REGION = 'AWS_REGION',
  // cognito
  COGNITO_REGION = 'COGNITO_REGION',
  COGNITO_USER_POOL_ID = 'COGNITO_USER_POOL_ID',
  COGNITO_CLIENT_ID = 'COGNITO_CLIENT_ID',
}

type CongitoConfiguration = {
  region: string;
  userPoolId: string;
  clientId: string;
};

const SSM_MEMOIZE_TIMEOUT = 300 * 1000; // 5mins

@Injectable()
export class SystemConfigProvider {
  public get isDebugging() {
    return this.getEnv('DEBUG') === 'true';
  }

  public get isProduction() {
    return this.getEnv('NODE_ENV', 'development') === 'production';
  }

  public get isTest() {
    return this.getEnv('NODE_ENV', 'development') === 'test';
  }

  public get enableSwagger() {
    return !this.isTest && (!this.isProduction || this.isDebugging);
  }

  public get port(): number {
    return parseInt(this.getEnv('PORT', '3001'), 10);
  }

  public get awsCredentials(): AwsCredentialIdentityProvider {
    return fromNodeProviderChain({
      clientConfig: {
        region: this.getEnv(ConfigKey.AWS_REGION),
      },
      roleSessionName: 'ather-gallery-backend',
    });
  }

  public get cognito(): Promise<CongitoConfiguration> {
    return this.getBatch([
      ConfigKey.COGNITO_REGION,
      ConfigKey.COGNITO_USER_POOL_ID,
      ConfigKey.COGNITO_CLIENT_ID,
    ]).then(values => ({
      region: values[ConfigKey.COGNITO_REGION] ?? this.getEnv(ConfigKey.AWS_REGION),
      userPoolId: values[ConfigKey.COGNITO_USER_POOL_ID],
      clientId: values[ConfigKey.COGNITO_CLIENT_ID],
    }));
  }

  public getEnv(key: string, defaultValue?: string) {
    return process.env[key] || defaultValue;
  }

  public async get(key: string): Promise<string> {
    let value = this.getEnv(key);

    if (typeof value === 'string' && value.startsWith('ssm:')) {
      const ssmKey = value.slice(4);
      const ssmResults = await this.getSSM([ssmKey]);
      value = ssmResults[ssmKey];
    }

    return value;
  }

  public async getBatch(keys: string[]): Promise<Record<string, string>> {
    return Promise.all(keys.map(key => this.getEnv(key))).then(async values => {
      const results = zipObject(keys, values);
      const ssmKeys = values
        .map((value, idx) =>
          typeof value === 'string' && value.startsWith('ssm:') ? keys[idx] : undefined,
        )
        .filter(key => !!key);

      if (ssmKeys.length) {
        const ssmKeyRevertMap = ssmKeys.reduce<Record<string, string>>(
          (all, key) => ({ ...all, [results[key].slice(4)]: key }),
          {},
        );

        const ssmResults = await this.getSSM(Object.keys(ssmKeyRevertMap));
        Object.keys(ssmKeyRevertMap).forEach(key => {
          results[ssmKeyRevertMap[key]] = ssmResults[key];
        });
      }

      return results;
    });
  }

  // memoize results for 5mins
  private getSSM = memoize(this._getSSM.bind(this), {
    cache: {
      create: () => new ExpiryMap(SSM_MEMOIZE_TIMEOUT),
    },
  });

  private async _getSSM(ssmKeys: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    const ssm = new SSM({
      credentials: this.awsCredentials,
    });
    const res = await ssm.getParameters({
      Names: ssmKeys, // remove ssm:
      WithDecryption: true,
    });

    if (res.InvalidParameters?.length) {
      throw new Error(`Failed to fetch parameters from SSM: ${res.InvalidParameters}`);
    }

    res.Parameters.forEach(value => {
      results[value.Name] = value.Value;
    });

    return results;
  }
}

const systemConfig = new SystemConfigProvider();

export default systemConfig;

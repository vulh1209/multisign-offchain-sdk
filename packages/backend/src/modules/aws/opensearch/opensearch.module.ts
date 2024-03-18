import createAwsOpensearchConnector from 'aws-opensearch-connector';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { DynamicModule, Logger, Module, ModuleMetadata, Type } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

import { parse } from '@utils/url';

export const OPENSEARCH_MODULE_OPTIONS = Symbol('OPENSEARCH_MODULE_OPTIONS');
export const OPENSEARCH_MODULE_CLIENT = 'OPENSEARCH_MODULE_CLIENT';
export const OPENSEARCH_DEFAULT_CLIENT = 'default';

type OpensearchCredentialsOptions = {
  endpoint: string;
  region?: string;
  credentials?: AwsCredentialIdentityProvider;
  assumeRoleArn?: string;
};

export type OpensearchModuleOptions = OpensearchCredentialsOptions & {
  name?: string;
};

export interface OpensearchOptionsFactory {
  createOpensearchOptions(): Promise<OpensearchCredentialsOptions> | OpensearchCredentialsOptions;
}

export interface OpensearchModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useExisting?: Type<OpensearchOptionsFactory>;
  useClass?: Type<OpensearchOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<OpensearchCredentialsOptions> | OpensearchCredentialsOptions;
  inject?: any[];
}

export const getOpensearchClientProviderKey = (name?: string) =>
  [OPENSEARCH_MODULE_CLIENT, name || OPENSEARCH_DEFAULT_CLIENT].join(':');

const logger = new Logger('OpensearchModule');

@Module({})
export class OpensearchModule {
  static register(config: OpensearchModuleOptions): DynamicModule {
    const { name } = config;

    return {
      module: OpensearchModule,
      providers: [
        {
          provide: OPENSEARCH_MODULE_OPTIONS,
          useValue: config,
        },
        {
          provide: getOpensearchClientProviderKey(name),
          useValue: this.getOpensearchClientProvider(config),
        },
      ],
      exports: [getOpensearchClientProviderKey(name)],
    };
  }

  static registerAsync(options: OpensearchModuleAsyncOptions) {
    const { name } = options;

    return {
      module: OpensearchModule,
      providers: this.createAsyncProviders(options),
      exports: [getOpensearchClientProviderKey(name)],
    };
  }

  private static createAsyncProviders(options: OpensearchModuleAsyncOptions) {
    if (options.useExisting || options.useFactory) {
      return [...this.createAsyncOptionsProvider(options)];
    }
    return [
      ...this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: OpensearchModuleAsyncOptions) {
    const { name } = options;

    if (options.useFactory) {
      return [
        {
          provide: OPENSEARCH_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: getOpensearchClientProviderKey(name),
          useFactory: this.getOpensearchClientProvider,
          inject: [OPENSEARCH_MODULE_OPTIONS],
        },
      ];
    }

    return [
      {
        provide: OPENSEARCH_MODULE_OPTIONS,
        useFactory: (optionsFactory: OpensearchOptionsFactory) =>
          optionsFactory.createOpensearchOptions(),
        inject: [options.useExisting || options.useClass],
      },
      {
        provide: getOpensearchClientProviderKey(name),
        useFactory: this.getOpensearchClientProvider,
        inject: [OPENSEARCH_MODULE_OPTIONS],
      },
    ];
  }

  private static async getOpensearchClientProvider(_options: OpensearchCredentialsOptions) {
    const { endpoint, region, assumeRoleArn } = _options;

    const parsed = parse(endpoint);
    const node = `${parsed.protocol}//${parsed.host}`;
    if (parsed.auth) {
      const [username, password] = parsed.auth.split(':');
      return new Client({
        node,
        auth: username && password ? { username, password } : undefined,
      });
    }

    let provider = _options.credentials;
    if (assumeRoleArn) {
      provider = fromTemporaryCredentials({
        params: {
          RoleArn: assumeRoleArn,
          RoleSessionName: `opensearch`,
        },
        masterCredentials: provider,
      });
    }

    let credentials: AwsCredentialIdentity;
    const config = { credentials, region };

    const autoRefreshCredentials = async () => {
      config.credentials = await provider();

      if (config.credentials.expiration) {
        const delta = Math.max(0, config.credentials.expiration.valueOf() - Date.now() - 300000);
        logger.debug(`Credential renewal job scheduled after ${delta}`);

        setTimeout(() => {
          logger.debug('Renewing credential...');
          autoRefreshCredentials();
        }, delta);
      }
    };

    await autoRefreshCredentials();

    return new Client({
      ...createAwsOpensearchConnector(config as any),
      node: endpoint,
    });
  }
}

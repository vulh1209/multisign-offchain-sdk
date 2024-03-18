import { fromNodeProviderChain, fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { DynamicModule, Inject, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';

export type AwsCredentialsOptions = {
  region?: string;
  endpoint?: string;
  credentials?: AwsCredentialIdentityProvider;
  assumeRoleArn?: string;
};

export type AwsModuleOptions<T, O extends Record<string, any> = any> = T &
  AwsCredentialsOptions & {
    name?: string;
    additionalClientOptions?: O;
  };

export interface AwsModuleOptionsFactory<T, O extends Record<string, any> = any> {
  createOptions(): Promise<AwsModuleOptions<T, O>> | AwsModuleOptions<T, O>;
}

export interface AwsModuleAsyncOptions<
  T extends Record<string, any> = Record<string, any>,
  O extends Record<string, any> = any,
> extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useExisting?: Type<AwsModuleOptionsFactory<T, O>>;
  useClass?: Type<AwsModuleOptionsFactory<T, O>>;
  useFactory?: (...args: any[]) => Promise<AwsModuleOptions<T, O>> | AwsModuleOptions<T, O>;
  inject?: any[];
}

export type IAwsClassConstructorOptions = Omit<AwsCredentialsOptions, 'assumeRoleArn'>;

export declare class BaseAwsClass {
  constructor(options: IAwsClassConstructorOptions);
}

export type CreateAwsModuleOptions<C extends BaseAwsClass> = {
  clazz: Type<C>;
  additionalProviders?: Provider[];
};

export type IAwsModule<T, O extends Record<string, any> = any> = {
  register(config: AwsModuleOptions<T, O>): DynamicModule;
  registerAsync(options: AwsModuleAsyncOptions<T, O>): DynamicModule;
};

export type AwsModuleResults<T, O extends Record<string, any> = any> = {
  AwsModule: IAwsModule<T, O>;
  getClientProviderKey(name?: string): string;
  InjecAwsClient(name?: string): ParameterDecorator;
  InjectAwsOptions(): ParameterDecorator;
};

const getDefaultAwsCredentials = (region?: string): AwsCredentialIdentityProvider =>
  fromNodeProviderChain({
    clientConfig: {
      region,
    },
    roleSessionName: `aws-module@factory`,
  });

export const createAwsModule = <T, C, O extends Record<string, any> = any>(
  moduleOptions: CreateAwsModuleOptions<C>,
): AwsModuleResults<T, O> => {
  const { clazz: AwsClass, additionalProviders = [] } = moduleOptions;

  const MODULE_OPTIONS = `${AwsClass.name}:MODULE_OPTIONS`;
  const MODULE_CLIENT = `${AwsClass.name}:MODULE_CLIENT`;

  const getClientProviderKey = (name?: string) => [MODULE_CLIENT, name || 'default'].join(':');
  const getOptionsProviderKey = (name?: string) => [MODULE_OPTIONS, name || 'default'].join(':');

  @Module({})
  class AwsModule {
    static register(config: AwsModuleOptions<T>): DynamicModule {
      const { name } = config;

      return {
        module: AwsModule,
        providers: [
          {
            provide: getOptionsProviderKey(name),
            useValue: config,
          },
          {
            provide: getClientProviderKey(name),
            useValue: this.getAwsClientProvider(config),
          },
          ...additionalProviders,
        ],
        exports: [
          getClientProviderKey(name),
          getOptionsProviderKey(name),
          ...additionalProviders.map(provider =>
            'provide' in provider ? provider.provide : provider,
          ),
        ],
      };
    }

    static registerAsync(options: AwsModuleAsyncOptions<T>) {
      const { name } = options;

      return {
        module: AwsModule,
        providers: [...this.createAsyncProviders(options), ...additionalProviders],
        exports: [
          getClientProviderKey(name),
          getOptionsProviderKey(name),
          ...additionalProviders.map(provider =>
            'provide' in provider ? provider.provide : provider,
          ),
        ],
      };
    }

    private static createAsyncProviders(options: AwsModuleAsyncOptions<T>) {
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

    private static createAsyncOptionsProvider(options: AwsModuleAsyncOptions<T>) {
      const { name } = options;

      if (options.useFactory) {
        return [
          {
            provide: getOptionsProviderKey(name),
            useFactory: options.useFactory,
            inject: options.inject || [],
          },
          {
            provide: getClientProviderKey(name),
            useFactory: this.getAwsClientProvider,
            inject: [getOptionsProviderKey(name)],
          },
        ];
      }

      return [
        {
          provide: getOptionsProviderKey(name),
          useFactory: (optionsFactory: AwsModuleOptionsFactory<T>) =>
            optionsFactory.createOptions(),
          inject: [options.useExisting || options.useClass],
        },
        {
          provide: getClientProviderKey(name),
          useFactory: this.getAwsClientProvider,
          inject: [getOptionsProviderKey(name)],
        },
      ];
    }

    private static async getAwsClientProvider(_options: AwsModuleOptions<T>) {
      const { region, endpoint, assumeRoleArn, additionalClientOptions } = _options;

      let credentials = _options.credentials ?? getDefaultAwsCredentials(region);
      if (assumeRoleArn) {
        credentials = fromTemporaryCredentials({
          params: {
            RoleArn: assumeRoleArn,
            RoleSessionName: `aws-module@${AwsClass.name}`,
          },
          masterCredentials: credentials,
        });
      }

      return new AwsClass({ region, endpoint, credentials, ...additionalClientOptions });
    }
  }

  const InjecAwsClient =
    (name?: string): ParameterDecorator =>
    (target, key, idx) => {
      Inject(getClientProviderKey(name))(target, key, idx);
    };

  const InjectAwsOptions =
    (name?: string): ParameterDecorator =>
    (target, key, idx) => {
      Inject(getOptionsProviderKey(name))(target, key, idx);
    };

  return { AwsModule, getClientProviderKey, InjecAwsClient, InjectAwsOptions };
};

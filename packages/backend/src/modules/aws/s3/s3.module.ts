import { S3, S3ClientConfig } from '@aws-sdk/client-s3';

import { createAwsModule } from '../aws-factory.module';

import { AwsS3Options } from './types';

const {
  AwsModule: AwsS3Module,
  getClientProviderKey: getS3ClientProviderKey,
  InjecAwsClient: InjectS3Client,
  InjectAwsOptions: InjectS3Options,
} = createAwsModule<AwsS3Options, S3, S3ClientConfig>({
  clazz: S3 as any,
});

export { AwsS3Module, getS3ClientProviderKey, InjectS3Client, InjectS3Options };

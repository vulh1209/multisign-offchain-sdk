import { AwsModuleOptions } from '../aws-factory.module';

export type AwsS3Options = AwsModuleOptions<{
  bucket: string;
  prefix?: string;
  cloudfrontDomain?: string;
  acceleration?: boolean;
}>;

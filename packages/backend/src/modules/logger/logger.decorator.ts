import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

export const InjectLogger =
  (): ParameterDecorator => (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    Inject(WINSTON_MODULE_NEST_PROVIDER)(target, propertyKey, parameterIndex);
  };

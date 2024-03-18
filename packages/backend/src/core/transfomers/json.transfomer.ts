import { instanceToPlain, plainToClass, Transform, TransformationType } from 'class-transformer';
import { Type } from '@nestjs/common';

import { isNullOrUndefined } from '@utils/is-null-or-undefined';

export type JsonToClassOptions<T> = {
  type: Type<T>;
};

export const TransformJson =
  <T>(options: JsonToClassOptions<T>): PropertyDecorator =>
  (target: any, propertyKey: string | symbol) => {
    Transform(({ value, type }) => {
      if (isNullOrUndefined(value)) return value;

      if (type === TransformationType.PLAIN_TO_CLASS) {
        const plain = typeof value === 'string' ? JSON.parse(value) : value;

        return plainToClass(options.type, plain);
      }
      if (type === TransformationType.CLASS_TO_PLAIN) {
        return instanceToPlain(value);
      }

      return value;
    })(target, propertyKey);
  };

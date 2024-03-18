import { Transform, TransformationType } from 'class-transformer';
import dayjs from 'dayjs';

import { isNullOrUndefined } from '@utils/is-null-or-undefined';

export const TransformDate =
  (): PropertyDecorator => (target: any, propertyKey: string | symbol) => {
    Transform(({ value, type }) => {
      if (isNullOrUndefined(value)) return value;

      if (type === TransformationType.PLAIN_TO_CLASS) {
        return dayjs(value).toDate();
      }
      if (type === TransformationType.CLASS_TO_PLAIN) {
        return dayjs(value).valueOf();
      }

      return value;
    })(target, propertyKey);
  };

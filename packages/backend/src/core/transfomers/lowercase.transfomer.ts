import { Transform } from 'class-transformer';

export const TransformLowercase =
  (): PropertyDecorator => (target: any, propertyKey: string | symbol) => {
    Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))(
      target,
      propertyKey,
    );
  };

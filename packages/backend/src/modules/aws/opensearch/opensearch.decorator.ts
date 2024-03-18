import { Inject } from '@nestjs/common';

import { getOpensearchClientProviderKey } from './opensearch.module';

export const InjectOpensearch =
  (name?: string): ParameterDecorator =>
  (target, key, idx) => {
    Inject(getOpensearchClientProviderKey(name))(target, key, idx);
  };

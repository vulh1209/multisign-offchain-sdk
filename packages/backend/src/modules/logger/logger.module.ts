import { WinstonModule } from 'nest-winston';
import { Global, Module } from '@nestjs/common';

import { loggerOptions } from './options';

@Global()
@Module({
  imports: [WinstonModule.forRoot(loggerOptions)],
})
export class LoggerModule {}

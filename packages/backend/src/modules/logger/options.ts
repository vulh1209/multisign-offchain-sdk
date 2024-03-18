import winston from 'winston';

import systemConfig from '@core/config/system';

const { format } = winston;
const { combine, timestamp, colorize, printf } = format;

export const consoleLogFormat = combine(
  winston.format(info => {
    info.level = info.level.toUpperCase();
    return info;
  })(),
  timestamp(),
  !systemConfig.isProduction &&
    colorize({
      all: true,
      colors: {
        info: 'green',
        debug: 'magenta',
        error: 'red',
        http: 'cyan',
      },
    }),
  printf(info => {
    const msgs = [`${info.timestamp} [${info.level}] ${info.message}`];
    if (info.stack) {
      const stacks = Array.isArray(info.stack) ? info.stack : [info.stack];
      stacks.forEach(stack => {
        if (stack instanceof Error) {
          msgs.push(stack.stack);
        } else {
          msgs.push(stack);
        }
      });
    }

    return msgs.join('\n');
  }),
);

export const loggerOptions: winston.LoggerOptions = {
  level: systemConfig.isDebugging || !systemConfig.isProduction ? 'debug' : 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(consoleLogFormat),
    }),
  ],
};

import '@env';
import 'reflect-metadata';

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path, { resolve } from 'path';

import { json, urlencoded } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { generateApi } from 'swagger-typescript-api';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import systemConfig from '@core/config/system';
import { loggerOptions } from '@modules/logger/options';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: WinstonModule.createLogger(loggerOptions),
  });

  app.setGlobalPrefix('api');

  // increase body limit
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  // validation
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: systemConfig.isDebugging,
      disableErrorMessages: systemConfig.isProduction,
      transform: true,
    }),
  );

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // enable cors
  app.enableCors({ credentials: true, origin: true });

  // trust proxy headers
  app.set('trust proxy', 1);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // enable swagger
  if (systemConfig.enableSwagger) {
    const options = new DocumentBuilder()
      .setTitle('Backend API')
      .setDescription(`Powered by Ather Labs`)
      .setVersion('1.0.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Account Token',
      })
      .build();

    // enable versioning
    app.enableVersioning({
      type: VersioningType.URI,
    });

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        defaultModelsExpandDepth: -1, // no models shown
        defaultModelExpandDepth: -1, // no model properties shown,
        syntaxHighlight: false,
      },
    });

    // generate typescript api
    if (systemConfig.getEnv('NODE_ENV') === 'local') {
      const docPath = path.resolve(__dirname, '../../docs/');
      if (!existsSync(docPath)) {
        mkdirSync(docPath, { recursive: true });
      }
      writeFileSync(resolve(docPath, 'api-spec.json'), JSON.stringify(document, null, 2));

      await generateApi({
        name: 'sdk',
        output: path.resolve(__dirname, '../../frontend/src/api'),
        spec: document as any,
        prettier: {
          singleQuote: true,
          jsxSingleQuote: false,
          arrowParens: 'avoid',
          trailingComma: 'all',
          tabWidth: 2,
          printWidth: 100,
          parser: 'typescript',
          unwrapResponseData: true,
        },
        httpClientType: 'axios',
      });
    }
  }

  await app.listen(systemConfig.port, () => {
    Logger.log(
      `🚀 API server listenning on http://localhost:${systemConfig.port}/api`,
      'Bootstrap',
    );
  });
}
bootstrap();

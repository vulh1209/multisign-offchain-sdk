import { Observable } from 'rxjs';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

const MAX_FILE_SIZE = 1048576;
const VALID_FILE_TYPE = ['image/png', 'image/jpg', 'image/jpeg'];

export class FileUpload {
  fieldname: string;

  originalname: string;

  encoding: string;

  mimetype: string;

  buffer: Buffer;

  size: number;
}

export const ApiFile =
  (options?: ApiPropertyOptions): PropertyDecorator =>
  (target: Record<string, any>, propertyKey: string | symbol) => {
    if (options?.isArray) {
      ApiProperty({
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
      })(target, propertyKey);
    } else {
      ApiProperty({
        type: 'string',
        format: 'binary',
      })(target, propertyKey);
    }
  };

@Injectable()
export class FilesToBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    if (req.body && Array.isArray(req.files) && req.files.length) {
      req.files.forEach((file: FileUpload) => {
        const { fieldname } = file;
        if (!req.body[fieldname]) {
          req.body[fieldname] = [file];
        } else {
          req.body[fieldname].push(file);
        }
      });
    }

    return next.handle();
  }
}

@Injectable()
export class FileToBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const { file } = req;
    if (req.body && req.file?.fieldname) {
      const { fieldname } = req.file;
      if (!req.body[fieldname]) {
        req.body[fieldname] = req.file;
      }
    }
    const fileSize = parseInt(req.headers['content-length'], 10);
    if (!VALID_FILE_TYPE.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large');
    }
    return next.handle();
  }
}

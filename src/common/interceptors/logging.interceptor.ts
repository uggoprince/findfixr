import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { sanitize } from '../utils/sanitizer.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = this.getRequest(context);
    const { method, url, body, headers } = request;

    // Sanitize request data
    const sanitizedBody = sanitize(body);
    const sanitizedHeaders = sanitize(headers);

    // Log request
    this.logger.log({
      type: 'REQUEST',
      method,
      url,
      body: sanitizedBody,
      headers: this.getRelevantHeaders(sanitizedHeaders),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const sanitizedResponse = sanitize(data);
          this.logger.log({
            type: 'RESPONSE',
            method,
            url,
            statusCode: context.switchToHttp().getResponse()?.statusCode,
            data: sanitizedResponse,
            duration: `${Date.now() - now}ms`,
          });
        },
        error: (error) => {
          this.logger.error({
            type: 'ERROR',
            method,
            url,
            statusCode: error?.status,
            message: error?.message,
            duration: `${Date.now() - now}ms`,
          });
        },
      }),
    );
  }

  private getRequest(context: ExecutionContext): Request {
    // Handle both HTTP and GraphQL contexts
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<Request>();
    } else {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext<{ req: Request }>().req;
    }
  }

  private getRelevantHeaders(headers: any): any {
    // Only log non-sensitive headers
    const relevantHeaders: any = {};
    const allowedHeaders = ['content-type', 'user-agent', 'accept'];

    for (const header of allowedHeaders) {
      if (headers[header]) {
        relevantHeaders[header] = headers[header];
      }
    }

    return relevantHeaders;
  }
}

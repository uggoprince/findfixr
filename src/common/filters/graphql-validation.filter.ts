import { Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

@Catch(BadRequestException)
export class GraphQLValidationFilter implements GqlExceptionFilter {
  catch(exception: BadRequestException, _host: ArgumentsHost) {
    const response = exception.getResponse() as any;

    // Extract validation messages
    const validationErrors = response.message || response || [];

    // Return a clean error format
    throw new BadRequestException({
      message: 'Validation failed',
      errors: Array.isArray(validationErrors)
        ? validationErrors
        : [validationErrors],
      statusCode: 400,
    });
  }
}

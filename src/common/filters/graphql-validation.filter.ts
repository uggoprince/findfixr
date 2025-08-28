import { Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch(BadRequestException)
export class GraphQLValidationFilter implements GqlExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    // Check if this is a GraphQL context
    if (host.getType<'graphql'>() === 'graphql') {
      const response = exception.getResponse() as any;

      // Extract validation messages
      const validationErrors = response.message || response || [];
      const errors = Array.isArray(validationErrors) ? validationErrors : [validationErrors];

      // Return a GraphQL error for GraphQL contexts
      return new GraphQLError('Validation failed', {
        extensions: {
          code: 'BAD_USER_INPUT',
          errors: errors,
          statusCode: 400,
        },
      });
    }

    // For non-GraphQL contexts (REST), re-throw the original exception
    throw exception;
  }
}

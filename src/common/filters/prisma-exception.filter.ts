// prisma-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientUnknownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    // Convert to GraphQL host
    const gqlHost = GqlArgumentsHost.create(host);

    // Get GraphQL info/context/args
    const ctx = gqlHost.getContext();
    const info = gqlHost.getInfo();
    const args = gqlHost.getArgs();

    let message = 'Something went wrong. Please try again later.';
    let code = 'INTERNAL_SERVER_ERROR';

    // Handle Prisma-specific codes
    if (exception.code === 'P2024') {
      message = 'Database connection timed out. Please try again.';
      code = 'DATABASE_TIMEOUT';
    }

    if (exception.code === 'P2002') {
      message = `Unique constraint failed on: ${exception.meta?.target}`;
      code = 'CONFLICT';
    }

    // Example: log with GraphQL context + query info
    console.error({
      path: info?.fieldName,
      args,
      user: ctx?.req?.user, // if you attached user in context
      prismaError: exception,
    });

    throw new GraphQLError(message, {
      extensions: {
        code,
        path: info?.path?.key, // GraphQL path (field that failed)
        timestamp: new Date().toISOString(),
      },
    });
  }
}

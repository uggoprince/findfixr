import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  <T = unknown>(data: unknown, context: ExecutionContext): T => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user as T;
  },
);

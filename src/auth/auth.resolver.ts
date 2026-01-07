import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { AuthDTO, LoginResponse } from './dto/auth.dto';
import { AuthController } from './auth.controller';

interface GqlContext {
  req: Request;
  res: Response;
}

@Resolver()
export class AuthResolver {
  private readonly authController: AuthController;
  constructor(private readonly authService: AuthService) {
    this.authController = new AuthController(authService);
  }

  @Mutation(() => LoginResponse)
  async login(@Args('credentials') credentials: AuthDTO, @Context() context: GqlContext) {
    const user = await this.authService.validateUser(credentials.email, credentials.password);
    // Generate tokens
    const result = this.authService.login(user);

    // Set refresh token in HTTP-only cookie
    this.authController.setRefreshTokenCookie(context.res, result.refreshToken);

    // Return response (without refresh token - it's in the cookie)
    return {
      accessToken: result.accessToken,
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
    };
  }
}

import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthDTO, LoginResponse } from './dto/auth.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => LoginResponse)
  async login(@Args('credentials') credentials: AuthDTO) {
    const user = await this.authService.validateUser(
      credentials.email,
      credentials.password,
    );
    return this.authService.login(user);
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/user.model';

interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  /**
   * Generate access token (short-lived, 15 minutes)
   */
  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    const expiresIn = this.configService.get<string>('app.accessTokenExpiration') || '15m';

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwtSecret'),
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Generate refresh token (long-lived, 7 days default)
   */
  generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    const expiresIn = this.configService.get<string>('app.refreshTokenExpiration') || '7d';

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwtRefreshSecret'),
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Generate both tokens
   */
  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  /**
   * Login - returns user data with access token
   * Refresh token should be set via cookie in the resolver/controller
   */
  login(user: User): { accessToken: string; refreshToken: string } & Omit<User, 'password'> {
    const { accessToken, refreshToken } = this.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      ...user,
    };
  }

  /**
   * Refresh tokens using a valid refresh token
   * Implements token rotation for security
   */
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('app.jwtRefreshSecret'),
      });

      // Ensure it's a refresh token, not an access token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get user from database to ensure they still exist
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens (token rotation)
      return {
        accessToken: this.generateAccessToken(user),
        newRefreshToken: this.generateRefreshToken(user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Get user by ID (used by JWT strategy)
   */
  async getUserById(id: string): Promise<User | null> {
    return this.userService.findById(id);
  }
}

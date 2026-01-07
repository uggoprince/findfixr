import { Controller, Post, Res, Req, HttpCode, HttpStatus, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { GqlAuthGuard } from './gql-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Refresh access token using refresh token from HTTP-only cookie
   * Called on app mount and when access token expires
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { accessToken, newRefreshToken } = await this.authService.refreshTokens(refreshToken);

    // Set new refresh token in HTTP-only cookie (token rotation)
    this.setRefreshTokenCookie(res, newRefreshToken);

    // Return access token in response body (stored in memory on frontend)
    return { accessToken };
  }

  /**
   * Logout - clears the refresh token cookie
   */
  @Post('logout')
  @UseGuards(GqlAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  /**
   * Helper method to set refresh token cookie
   */
  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV?.toLowerCase() === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  /**
   * Helper method to clear refresh token cookie
   */
  clearRefreshTokenCookie(res: Response): void {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV?.toLowerCase() === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
  }
}

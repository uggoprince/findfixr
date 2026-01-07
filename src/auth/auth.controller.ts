import { Controller, Post, Res, Req, HttpCode, HttpStatus, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { GqlAuthGuard } from './gql-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Refresh access token using refresh token from HTTP-only cookie
   * Called on app mount and when access token expires
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 200, description: 'Returns new access token' })
  @ApiResponse({ status: 401, description: 'Refresh token not found or invalid' })
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
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  /**
   * Helper method to set refresh token cookie
   */
  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  /**
   * Helper method to clear refresh token cookie
   */
  clearRefreshTokenCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production';

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin in production
      maxAge: 0,
      path: '/',
    });
  }
}

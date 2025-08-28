import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get('*')
  notFound(@Res() res: Response) {
    return res.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'This REST endpoint does not exist.',
      error: 'Not Found',
      timestamp: new Date().toISOString(),
      path: res.req.url,
    });
  }
}

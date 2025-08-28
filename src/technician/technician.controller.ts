import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  UploadedFile,
  Req,
  ParseUUIDPipe,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { TechnicianService } from './technician.service';
import { CreateTechnicianInput } from './dto/technician.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { UpdateTechnicianInput } from './dto/update-technician.dto';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Technician } from '@prisma/client';

@Controller('technicians')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Post('upload-profile-image')
  @UseGuards(GqlAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@Req() req, @UploadedFile() file: Express.Multer.File, @Res() res: Response): Promise<void> {
    try {
      const userId: string = String(req.user.userId); // ensure userId is a string

      if (!file) {
        res.status(400).json({
          statusCode: 400,
          message: 'No file provided',
          timestamp: new Date().toISOString(),
          path: req.url,
        });
        return;
      }

      const result = await this.technicianService.updateProfilePicture(userId, file);

      res.status(200).json({
        message: 'Profile image uploaded successfully',
        url: result,
      });
    } catch (error) {
      console.log('🔴 Controller caught error:', error);

      res.status(400).json({
        statusCode: 400,
        message: error.message || 'Upload failed',
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }
  }

  @Get()
  async findAll(
    @Query('filter') filter?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<PaginatedResponse<Technician>> {
    const [items, totalCount] = await Promise.all([
      this.technicianService.findAll(filter, page, pageSize),
      this.technicianService.countAll(filter),
    ]);

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    return {
      items,
      totalCount,
      hasNextPage: skip + take < totalCount,
      nextSkip: skip + take < totalCount ? skip + take : undefined,
    };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Technician | null> {
    return this.technicianService.findById(id);
  }

  @Post()
  @UseGuards(GqlAuthGuard)
  async create(
    @CurrentUser() user: { userId: string; email: string },
    @Body() input: CreateTechnicianInput,
  ): Promise<Technician> {
    return this.technicianService.create(user.userId, input);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() input: UpdateTechnicianInput): Promise<Technician> {
    return this.technicianService.update(id, input);
  }

  @Put(':id/location')
  async updateLocation(@Param('id') id: string, @Body() location: { lat: number; lng: number }) {
    return this.technicianService.updateLocation(id, location.lat, location.lng);
  }
}

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnicianInput } from './dto/technician.dto';
import { Technician, Prisma, Availability } from '@prisma/client';
import { PaginatedTechnicians } from './models/paginated-technicians.model';
import { UpdateTechnicianInput } from './dto/update-technician.dto';
import { UploadService } from 'src/upload/upload.service';
import { GraphQLError } from 'graphql';

@Injectable()
export class TechnicianService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(userId: string, input: CreateTechnicianInput): Promise<Technician> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    const existingTechnician = await this.prisma.technician.findUnique({
      where: { userId },
    });
    if (existingTechnician) {
      throw new ConflictException(`Technician already exists for user.`);
    }
    const { availability, ...rest } = input;
    const data = {
      userId,
      ...rest,
      availability: availability ? (availability.toUpperCase() as Availability) : undefined, // ✅ convert to enum
    };
    return this.prisma.technician.create({ data });
  }

  async findAll(filter?: string, page = 1, pageSize = 10): Promise<Technician[]> {
    return this.prisma.technician.findMany({
      where: filter
        ? {
            OR: [
              { businessName: { contains: filter, mode: 'insensitive' } },
              { profession: { contains: filter, mode: 'insensitive' } },
              { bio: { contains: filter, mode: 'insensitive' } },
            ],
          }
        : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countAll(filter?: string): Promise<number> {
    return this.prisma.technician.count({
      where: filter
        ? {
            OR: [
              { businessName: { contains: filter, mode: 'insensitive' } },
              { profession: { contains: filter, mode: 'insensitive' } },
              { bio: { contains: filter, mode: 'insensitive' } },
            ],
          }
        : undefined,
    });
  }

  async findAllCursorBased(cursor?: string, take = 10, filter?: string): Promise<PaginatedTechnicians> {
    const where = filter
      ? {
          OR: [
            {
              profession: {
                contains: filter,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              businessName: {
                contains: filter,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              bio: {
                contains: filter,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : undefined;

    const technician = await this.prisma.technician.findMany({
      take: take + 1, // Fetch one extra to check if next page exists
      skip: cursor ? 1 : 0, // Skip the cursor record if present
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: { createdAt: 'desc' },
      // select: {
      //   id: true,
      //   userId: true,
      //   businessName: true,
      //   profession: true,
      //   bio: true,
      //   profilePicture: true,
      //   yearsExperience: true,
      //   availability: true,
      //   createdAt: true,
      //   updatedAt: true,
      //   latitude: true,
      //   longitude: true,
      // },
    });

    const hasNextPage = technician.length > take;
    const items = hasNextPage ? technician.slice(0, take) : technician;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      totalCount: await this.prisma.technician.count({ where }),
      hasNextPage,
      nextCursor,
    };
  }

  async findById(id: string): Promise<Technician | null> {
    return this.prisma.technician.findUnique({ where: { id } });
  }

  // Option 1: Using raw SQL for PostgreSQL with PostGIS
  async findNearby(lat: number, lng: number, radiusKm = 5): Promise<Technician[]> {
    return this.prisma.$queryRaw`
      SELECT t.* FROM "Technician" t
      JOIN "Location" l ON t.id = l."technicianId"
      WHERE ST_DWithin(
        ST_MakePoint(l.longitude, l.latitude)::geography,
        ST_MakePoint(${lng}, ${lat})::geography,
        ${radiusKm * 1000}
      )
    `;
  }

  // Option 2: Using bounding box approach (works with any DB)
  async findNearbyBoundingBox(lat: number, lng: number, radiusKm = 5): Promise<Technician[]> {
    // Approximate degrees per km
    const latDelta = radiusKm / 111.32; // 1 degree lat ≈ 111.32 km
    const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

    return this.prisma.technician.findMany({
      where: {
        location: {
          is: {
            lat: {
              gte: lat - latDelta,
              lte: lat + latDelta,
            },
            lng: {
              gte: lng - lngDelta,
              lte: lng + lngDelta,
            },
          },
        },
      },
      include: {
        location: true,
      },
    });
  }

  // Option 3: Fetch all and filter in memory (only for small datasets)
  async findNearbyInMemory(lat: number, lng: number, radiusKm = 5): Promise<Technician[]> {
    const technicians = await this.prisma.technician.findMany({
      include: {
        location: true,
      },
    });

    return technicians.filter((tech) => {
      if (!tech.location) return false;

      const distance = this.calculateDistance(lat, lng, tech.location.lat, tech.location.lng);

      return distance <= radiusKm;
    });
  }

  async update(userId: string, input: UpdateTechnicianInput): Promise<Technician> {
    const existing = await this.prisma.technician.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new GraphQLError('Technician not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return await this.prisma.technician.update({
      where: { id: existing.id },
      data: {
        ...input,
        // businessName: input.businessName,
        // bio: input.bio,
        // profilePicture: input.profilePicture,
        // yearsExperience: input.yearsExperience,
        // availability: input.availability,
      },
    });
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<Technician> {
    const technician = await this.prisma.technician.findUnique({
      where: { id },
    });
    if (!technician) {
      throw new NotFoundException(`Technician not found`);
    }

    await this.prisma.location.upsert({
      where: { technicianId: id },
      create: {
        technicianId: id,
        lat,
        lng,
      },
      update: {
        lat,
        lng,
        lastUpdatedAt: new Date(),
      },
    });

    // Return the updated technician with location
    const updated = await this.prisma.technician.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!updated) {
      throw new NotFoundException(`Technician not found after update`);
    }

    return updated;
  }

  async updateProfilePicture(userId: string, file: Express.Multer.File): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validation = this.uploadService.validateFile(file, allowedTypes, maxSize);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    // Upload image to S3
    const imageUrl = await this.uploadService.uploadFile(file);
    // const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;

    // Get the technician
    const technician = await this.prisma.technician.findUnique({
      where: { userId },
    });
    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    // Save image URL in DB
    const technicianUpdate = await this.prisma.technician.update({
      where: { id: technician.id },
      data: {
        profilePicture: imageUrl,
      },
    });

    return technicianUpdate.profilePicture ?? ''; // Return the image URL or empty string if null
  }

  // Haversine formula for distance calculation
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getTechnicianByUserId(userId: string): Promise<Technician> {
    const technician = await this.prisma.technician.findUnique({
      where: { userId },
      include: { location: true }, // Include location if needed
    });

    if (!technician) {
      throw new NotFoundException(`Technician not found`);
    }

    return technician;
  }
}

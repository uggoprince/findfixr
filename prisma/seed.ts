import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse the DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const url = new URL(databaseUrl);

const pool = new Pool({
  host: url.hostname,
  port: Number.parseInt(url.port || '5432', 10),
  database: url.pathname.slice(1), // Remove leading slash
  user: url.username,
  password: url.password,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Seeding database...');

  // Seed service categories
  const categories = [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Auto Repair',
    'HVAC',
    'Painting',
    'Roofing',
    'Appliance Repair',
    'IT Support',
  ];

  for (const name of categories) {
    await prisma.serviceCategory.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name} related services.`,
      },
    });
  }

  console.log('✅ Seeded service categories');

  // Seed service types
  const serviceTypes = [
    { name: 'Repair', code: 'REPAIR' },
    { name: 'Install', code: 'INSTALL' },
  ];

  for (const type of serviceTypes) {
    await prisma.serviceType.upsert({
      where: { code: type.code },
      update: {},
      create: {
        name: type.name,
        code: type.code,
        description: `${type.name} services`,
      },
    });
  }

  console.log('✅ Seeded service types');

  // Fetch required references
  const plumbingCategory = await prisma.serviceCategory.findFirst({
    where: { name: 'Plumbing' },
  });

  const electricalCategory = await prisma.serviceCategory.findFirst({
    where: { name: 'Electrical' },
  });

  const repairServiceType = await prisma.serviceType.findFirst({
    where: { code: 'REPAIR' },
  });

  const installServiceType = await prisma.serviceType.findFirst({
    where: { code: 'INSTALL' },
  });

  if (!plumbingCategory || !electricalCategory || !repairServiceType || !installServiceType) {
    throw new Error('Missing required categories or service types.');
  }

  // Optional: create a sample user and technician
  const user = await prisma.user.upsert({
    where: { email: 'tech@example.com' },
    update: {},
    create: {
      email: 'tech@example.com',
      firstName: 'Jane',
      lastName: 'Technician',
      phone: '1234567890',
      password: 'hashed-password', // replace with real hash in production
    },
  });

  await prisma.technician.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      profession: 'Plumber',
      businessName: 'Jane Fixes It',
      bio: 'Experienced plumber and electrician',
      availability: 'ONLINE',
      yearsExperience: 5,
      services: {
        create: [
          {
            name: 'Pipe Repair',
            price: 50.0,
            description: 'Professional pipe repair services',
            serviceCategory: {
              connect: { id: plumbingCategory.id },
            },
            serviceType: {
              connect: { id: repairServiceType.id },
            },
          },
          {
            name: 'Electrical Installation',
            price: 75.0,
            description: 'Professional electrical installation services',
            serviceCategory: {
              connect: { id: electricalCategory.id },
            },
            serviceType: {
              connect: { id: installServiceType.id },
            },
          },
        ],
      },
      location: {
        create: {
          lat: 6.5244,
          lng: 3.3792,
        },
      },
    },
  });

  console.log('✅ Sample user & technician created');
  console.log('🌱 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

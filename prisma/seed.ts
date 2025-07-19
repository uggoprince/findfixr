import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      businessName: 'Jane Fixes It',
      bio: 'Experienced plumber and electrician',
      availability: 'ONLINE',
      yearsExperience: 5,
      services: {
        create: [
          { serviceCategory: { connect: { name: 'Plumbing' } } },
          { serviceCategory: { connect: { name: 'Electrical' } } },
        ],
      },
      location: {
        create: {
          lat: 6.5244, // Example: Lagos
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
  .finally(() => {
    void prisma.$disconnect();
  });

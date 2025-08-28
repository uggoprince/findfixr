import { registerEnumType } from '@nestjs/graphql';
import { Availability } from '@prisma/client';

registerEnumType(Availability, {
  name: 'Availability', // must match the enum name
  description: 'Technician availability status', // optional
});

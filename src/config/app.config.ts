import { registerAs } from '@nestjs/config';

interface AppConfig {
  port: number;
  jwtSecret: string | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3000', 10),
    jwtSecret: process.env.JWT_SECRET,
  }),
);

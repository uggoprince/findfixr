import { registerAs } from '@nestjs/config';

interface AppConfig {
  port: number;
  jwtSecret: string | undefined;
  region: string;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  s3Bucket: string | undefined;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3000', 10),
    jwtSecret: process.env.JWT_SECRET,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET,
  }),
);

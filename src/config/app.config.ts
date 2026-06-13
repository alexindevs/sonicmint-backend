import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTtl: '15m',
  refreshTtl: '30d',
}));

export const awsConfig = registerAs('aws', () => ({
  region: process.env.AWS_REGION ?? 'eu-west-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3Bucket: process.env.S3_BUCKET_AUDIO ?? 'sonicmint-audio',
  cdnBaseUrl: process.env.CDN_BASE_URL ?? 'https://cdn.sonicmint.io',
}));

export const stripeConfig = registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID,
}));

export const revenueConfig = registerAs('revenue', () => ({
  royaltyRateGbp: parseFloat(process.env.ROYALTY_RATE_GBP ?? '0.004'),
  platformFeePct: parseFloat(process.env.PLATFORM_FEE_PCT ?? '15'),
}));

export const aiConfig = registerAs('ai', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY,
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
}));

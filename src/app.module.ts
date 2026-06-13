import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { TracksModule } from './modules/tracks/tracks.module';
import { MeModule } from './modules/me/me.module';
import { StudioModule } from './modules/studio/studio.module';
import { WorkerModule } from './modules/worker/worker.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import {
  appConfig,
  jwtConfig,
  awsConfig,
  stripeConfig,
  revenueConfig,
  aiConfig,
  redisConfig,
} from './config/app.config';
import { User } from './modules/auth/entities/user.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { Track } from './modules/tracks/entities/track.entity';
import { AudioJob } from './modules/tracks/entities/audio-job.entity';
import { StreamEvent } from './modules/tracks/entities/stream-event.entity';
import { Report } from './modules/reports/entities/report.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, awsConfig, stripeConfig, revenueConfig, aiConfig, redisConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, RefreshToken, Track, AudioJob, StreamEvent, Report],
        synchronize: config.get<string>('app.nodeEnv') !== 'production',
        logging: config.get<string>('app.nodeEnv') === 'development',
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('redis.url') },
      }),
    }),
    AuthModule,
    TracksModule,
    MeModule,
    StudioModule,
    WorkerModule,
    AdminModule,
    UploadsModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudioService } from './studio.service';
import { StudioController } from './studio.controller';
import { Track } from '../tracks/entities/track.entity';
import { AudioJob } from '../tracks/entities/audio-job.entity';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'audio-processing' }),
    TypeOrmModule.forFeature([Track, AudioJob]),
  ],
  providers: [StudioService],
  controllers: [StudioController],
})
export class StudioModule {}

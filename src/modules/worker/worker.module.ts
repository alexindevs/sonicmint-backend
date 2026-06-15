import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioProcessor } from './audio.processor';
import { ClipProcessor } from './clip.processor';
import { Track } from '../tracks/entities/track.entity';
import { AudioJob } from '../tracks/entities/audio-job.entity';
import { Clip } from '../clips/entities/clip.entity';
import { S3Service } from '../../utils/s3.service';
import { LyriaService } from '../../utils/lyria.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'audio-processing' }),
    BullModule.registerQueue({ name: 'clip-processing' }),
    TypeOrmModule.forFeature([Track, AudioJob, Clip]),
  ],
  providers: [AudioProcessor, ClipProcessor, S3Service, LyriaService],
})
export class WorkerModule {}

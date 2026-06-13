import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TracksService } from './tracks.service';
import { TracksController } from './tracks.controller';
import { Track } from './entities/track.entity';
import { AudioJob } from './entities/audio-job.entity';
import { StreamEvent } from './entities/stream-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Track, AudioJob, StreamEvent])],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TypeOrmModule],
})
export class TracksModule {}

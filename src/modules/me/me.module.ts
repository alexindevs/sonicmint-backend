import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeService } from './me.service';
import { MeController } from './me.controller';
import { Track } from '../tracks/entities/track.entity';
import { StreamEvent } from '../tracks/entities/stream-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Track, StreamEvent])],
  providers: [MeService],
  controllers: [MeController],
})
export class MeModule {}

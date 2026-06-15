import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ClipsController } from './clips.controller';
import { ClipsService } from './clips.service';
import { Clip } from './entities/clip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clip]),
    BullModule.registerQueue({ name: 'clip-processing' }),
  ],
  controllers: [ClipsController],
  providers: [ClipsService],
})
export class ClipsModule {}

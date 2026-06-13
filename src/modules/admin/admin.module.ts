import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Track } from '../tracks/entities/track.entity';
import { Report } from '../reports/entities/report.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Track, Report, User])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { S3Service } from '../../utils/s3.service';

@Module({
  providers: [UploadsService, S3Service],
  controllers: [UploadsController],
})
export class UploadsModule {}

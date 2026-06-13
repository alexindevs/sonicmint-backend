import { Injectable } from '@nestjs/common';
import { S3Service } from '../../utils/s3.service';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  constructor(private readonly s3: S3Service) {}

  async presignCoverUpload(
    userId: string,
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const ext = extname(filename) || '.jpg';
    const key = `covers/${userId}/${randomUUID()}${ext}`;
    const uploadUrl = await this.s3.getPresignedUploadUrl(key, contentType);
    return { uploadUrl, key };
  }
}

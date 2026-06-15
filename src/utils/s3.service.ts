import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cdnBaseUrl: string;
  private readonly useLocal: boolean;
  private readonly localBaseUrl: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = configService.get<string>('aws.accessKeyId') ?? '';
    const secretAccessKey =
      configService.get<string>('aws.secretAccessKey') ?? '';

    this.useLocal = !accessKeyId || !secretAccessKey;

    this.client = new S3Client({
      region: configService.get<string>('aws.region') ?? 'eu-west-1',
      credentials: { accessKeyId, secretAccessKey },
    });

    this.bucket =
      configService.get<string>('aws.s3Bucket') ?? 'sonicmint-audio';
    this.cdnBaseUrl =
      configService.get<string>('aws.cdnBaseUrl') ?? 'https://cdn.sonicmint.io';

    const port = configService.get<string>('app.port') ?? '3001';
    this.localBaseUrl = `http://localhost:${port}/uploads`;

    if (this.useLocal) {
      this.logger.warn(
        'AWS credentials not set — audio will be stored locally under uploads/',
      );
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (this.useLocal) {
      const dest = join(process.cwd(), 'uploads', key);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, buffer);
      return `${this.localBaseUrl}/${key}`;
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return `${this.cdnBaseUrl}/${key}`;
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 600,
  ): Promise<string> {
    if (this.useLocal) {
      return `${this.localBaseUrl}/presign-stub?key=${encodeURIComponent(key)}`;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getSignedUrl(
      this.client as any,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }) as any,
      { expiresIn },
    );
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 600): Promise<string> {
    if (this.useLocal) {
      return `${this.localBaseUrl}/${key}`;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getSignedUrl(
      this.client as any,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }) as any,
      { expiresIn },
    );
  }
}

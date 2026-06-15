import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, UnrecoverableError } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { Track } from '../tracks/entities/track.entity';
import { AudioJob, JobStatus } from '../tracks/entities/audio-job.entity';
import { S3Service } from '../../utils/s3.service';
import { LyriaService } from '../../utils/lyria.service';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface AudioJobPayload {
  jobId: string;
  trackId: string;
  userId: string;
  prompt: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  instruments?: string[];
}

@Processor('audio-processing')
export class AudioProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioProcessor.name);

  constructor(
    @InjectRepository(Track) private tracksRepo: Repository<Track>,
    @InjectRepository(AudioJob) private audioJobsRepo: Repository<AudioJob>,
    private s3: S3Service,
    private lyria: LyriaService,
  ) {
    super();
  }

  async process(job: Job<AudioJobPayload>): Promise<void> {
    const {
      jobId,
      trackId,
      userId,
      prompt,
      genre,
      mood,
      bpm,
      key,
      instruments,
    } = job.data;

    this.logger.log(`Processing audio job ${jobId} for track ${trackId}`);

    await this.audioJobsRepo.update(jobId, { status: JobStatus.PROCESSING });

    const rawPath = join(tmpdir(), `${trackId}-raw.mp3`);
    const previewPath = join(tmpdir(), `${trackId}-preview.mp3`);

    try {
      // 1. Generate full track with Lyria
      const audioBuffer = await this.lyria.generateTrack({
        prompt,
        genre,
        mood,
        bpm,
        key,
        instruments,
      });

      // 2. Write to temp file
      await writeFile(rawPath, audioBuffer);

      // 3. Upload full track to S3
      const audioKey = `transcoded/${userId}/${trackId}.mp3`;
      const audioUrl = await this.s3.upload(
        audioKey,
        audioBuffer,
        'audio/mpeg',
      );

      // 4. Cut 30s preview with ffmpeg
      await this.cutPreview(rawPath, previewPath);
      const { readFile } = await import('fs/promises');
      const previewBuffer = await readFile(previewPath);

      // 5. Upload preview to S3
      const previewKey = `previews/${userId}/${trackId}-preview.mp3`;
      const previewUrl = await this.s3.upload(
        previewKey,
        previewBuffer,
        'audio/mpeg',
      );

      // 6. Update track record
      await this.tracksRepo.update(trackId, { audioUrl, previewUrl });
      await this.audioJobsRepo.update(jobId, {
        status: JobStatus.DONE,
        s3Mp3Key: audioKey,
        s3PreviewKey: previewKey,
      });

      this.logger.log(`Job ${jobId} completed successfully`);
    } catch (err) {
      const raw = err instanceof Error ? err : new Error(String(err));
      const message = raw.message;
      this.logger.error(`Job ${jobId} failed: ${message}`);
      await this.audioJobsRepo.update(jobId, {
        status: JobStatus.FAILED,
        errorMsg: message,
      });
      // Don't retry quota errors or auth errors — they won't self-heal
      const isUnrecoverable =
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('INVALID_ARGUMENT');
      throw isUnrecoverable ? new UnrecoverableError(message) : raw;
    } finally {
      await Promise.allSettled([unlink(rawPath), unlink(previewPath)]);
    }
  }

  private cutPreview(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(0)
        .setDuration(30)
        .audioCodec('libmp3lame')
        .audioBitrate('64k')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }
}

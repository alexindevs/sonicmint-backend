import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, UnrecoverableError } from 'bullmq';
import { Clip, ClipStatus } from '../clips/entities/clip.entity';
import { S3Service } from '../../utils/s3.service';
import { LyriaService } from '../../utils/lyria.service';

export interface ClipJobPayload {
  clipId: string;
  userId: string;
  prompt: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  instruments?: string[];
}

@Processor('clip-processing')
export class ClipProcessor extends WorkerHost {
  private readonly logger = new Logger(ClipProcessor.name);

  constructor(
    @InjectRepository(Clip) private clipsRepo: Repository<Clip>,
    private s3: S3Service,
    private lyria: LyriaService,
  ) {
    super();
  }

  async process(job: Job<ClipJobPayload>): Promise<void> {
    const { clipId, userId, prompt, genre, mood, bpm, instruments } = job.data;
    this.logger.log(`Processing clip ${clipId}`);

    await this.clipsRepo.update(clipId, { status: ClipStatus.PROCESSING });

    try {
      const audioBuffer = await this.lyria.generateClip({
        prompt,
        genre,
        mood,
        bpm,
        instruments,
      });

      const key = `clips/${userId}/${clipId}.mp3`;
      const audioUrl = await this.s3.upload(key, audioBuffer, 'audio/mpeg');

      await this.clipsRepo.update(clipId, {
        status: ClipStatus.DONE,
        audioUrl,
      });

      this.logger.log(`Clip ${clipId} done`);
    } catch (err) {
      const raw = err instanceof Error ? err : new Error(String(err));
      const message = raw.message;
      this.logger.error(`Clip ${clipId} failed: ${message}`);
      await this.clipsRepo.update(clipId, {
        status: ClipStatus.FAILED,
        errorMsg: message,
      });
      const isUnrecoverable =
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('INVALID_ARGUMENT');
      throw isUnrecoverable ? new UnrecoverableError(message) : raw;
    }
  }
}

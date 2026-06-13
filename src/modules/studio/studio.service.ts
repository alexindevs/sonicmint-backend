import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Track, TrackStatus } from '../tracks/entities/track.entity';
import { AudioJob, JobStatus } from '../tracks/entities/audio-job.entity';
import { User } from '../auth/entities/user.entity';
import { GenerateDto } from './dto/generate.dto';
import { AudioJobPayload } from '../worker/audio.processor';

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#00E676 0%,#0EA5E9 100%)',
  'linear-gradient(135deg,#7C3AED 0%,#EC4899 100%)',
  'linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)',
  'linear-gradient(135deg,#10B981 0%,#1E40AF 100%)',
  'linear-gradient(135deg,#06B6D4 0%,#8B5CF6 100%)',
  'linear-gradient(135deg,#F472B6 0%,#22D3EE 100%)',
  'linear-gradient(135deg,#FACC15 0%,#16A34A 100%)',
  'linear-gradient(135deg,#A855F7 0%,#0F172A 100%)',
];

@Injectable()
export class StudioService {
  constructor(
    @InjectRepository(Track) private tracksRepo: Repository<Track>,
    @InjectRepository(AudioJob) private audioJobsRepo: Repository<AudioJob>,
    @InjectQueue('audio-processing') private audioQueue: Queue,
  ) {}

  async generate(dto: GenerateDto, user: User) {
    const cover =
      dto.cover ?? COVER_GRADIENTS[Math.floor(Math.random() * COVER_GRADIENTS.length)];

    const track = this.tracksRepo.create({
      title: dto.title ?? 'Untitled',
      artist: user.displayName,
      genre: dto.genre ?? 'Electronic',
      mood: dto.mood ?? 'Chill',
      key: dto.key ?? 'C',
      bpm: dto.bpm ?? 120,
      durationSec: 0,
      coverGradient: cover,
      userId: user.id,
      status: TrackStatus.DRAFT,
    });
    await this.tracksRepo.save(track);

    const audioJob = this.audioJobsRepo.create({
      trackId: track.id,
      s3RawKey: `raw/generated/${track.id}.mp3`,
      status: JobStatus.PENDING,
    });
    await this.audioJobsRepo.save(audioJob);

    const payload: AudioJobPayload = {
      jobId: audioJob.id,
      trackId: track.id,
      userId: user.id,
      prompt: dto.prompt,
      genre: dto.genre,
      mood: dto.mood,
      bpm: dto.bpm,
      key: dto.key,
      instruments: dto.instruments,
    };

    await this.audioQueue.add('generate-track', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return {
      trackId: track.id,
      jobId: audioJob.id,
      jobStatus: JobStatus.PENDING,
      cover,
    };
  }
}

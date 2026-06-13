import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track, TrackStatus } from './entities/track.entity';
import { AudioJob, JobStatus } from './entities/audio-job.entity';
import { StreamEvent } from './entities/stream-event.entity';
import { CreateTrackDto } from './dto/create-track.dto';
import { StreamEventDto } from './dto/stream-event.dto';
import { User, Role } from '../auth/entities/user.entity';

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(Track) private tracksRepo: Repository<Track>,
    @InjectRepository(AudioJob) private audioJobsRepo: Repository<AudioJob>,
    @InjectRepository(StreamEvent)
    private streamEventsRepo: Repository<StreamEvent>,
  ) {}

  async findAllPublic(genre?: string, mood?: string, limit = 50, offset = 0) {
    const where: Partial<Track> = { status: TrackStatus.PUBLISHED };
    if (genre) where.genre = genre;
    if (mood) where.mood = mood;

    const [tracks, total] = await this.tracksRepo.findAndCount({
      where,
      order: { releasedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { tracks: tracks.map(this.toResponse), total, limit, offset };
  }

  async findTrending() {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const tracks = await this.tracksRepo
      .createQueryBuilder('track')
      .where('track.status = :status', { status: TrackStatus.PUBLISHED })
      .orderBy('track.streams', 'DESC')
      .take(4)
      .getMany();

    return tracks.map(this.toResponse);
  }

  async findNewReleases() {
    const tracks = await this.tracksRepo.find({
      where: { status: TrackStatus.PUBLISHED },
      order: { releasedAt: 'DESC' },
      take: 4,
    });

    return tracks.map(this.toResponse);
  }

  async findOne(id: string) {
    const track = await this.tracksRepo.findOneBy({ id });
    if (!track) throw new NotFoundException('Track not found');
    return this.toResponse(track);
  }

  async create(dto: CreateTrackDto, user: User) {
    const track = this.tracksRepo.create({
      title: dto.title,
      artist: user.displayName,
      genre: dto.genre,
      mood: dto.mood,
      key: dto.key,
      bpm: dto.bpm,
      durationSec: dto.durationSec,
      coverGradient: dto.cover,
      userId: user.id,
      status: TrackStatus.DRAFT,
    });
    await this.tracksRepo.save(track);

    const audioJob = this.audioJobsRepo.create({
      trackId: track.id,
      s3RawKey: dto.s3RawKey,
      status: JobStatus.PENDING,
    });
    await this.audioJobsRepo.save(audioJob);

    return {
      id: track.id,
      title: track.title,
      status: 'Draft',
      audioUrl: null,
      jobStatus: audioJob.status,
    };
  }

  async publish(id: string, user: User) {
    const track = await this.tracksRepo.findOne({
      where: { id },
      relations: { audioJob: true },
    });
    if (!track) throw new NotFoundException('Track not found');
    if (track.userId !== user.id) throw new ForbiddenException();
    if (track.audioJob?.status !== JobStatus.DONE) {
      throw new BadRequestException('Audio processing is not complete');
    }

    track.status = TrackStatus.PUBLISHED;
    track.releasedAt = new Date();
    await this.tracksRepo.save(track);

    return this.toResponse(track);
  }

  async remove(id: string, user: User) {
    const track = await this.tracksRepo.findOneBy({ id });
    if (!track) throw new NotFoundException('Track not found');

    const isOwner = track.userId === user.id;
    const isAdmin = user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException();

    track.status = TrackStatus.TAKEN_DOWN;
    await this.tracksRepo.save(track);

    return { ok: true };
  }

  async recordStream(id: string, dto: StreamEventDto, userId?: string) {
    const track = await this.tracksRepo.findOneBy({ id });
    if (!track) throw new NotFoundException('Track not found');

    await this.streamEventsRepo.save(
      this.streamEventsRepo.create({
        trackId: id,
        userId,
        durationSec: dto.durationSec,
      }),
    );

    await this.tracksRepo.increment({ id }, 'streams', 1);

    return { ok: true };
  }

  async getJobStatus(id: string) {
    const job = await this.audioJobsRepo.findOneBy({ trackId: id });
    if (!job) throw new NotFoundException('Job not found');
    return {
      status: job.status,
      progress: job.status === JobStatus.DONE ? 100 : 0,
    };
  }

  async findByUser(userId: string) {
    const tracks = await this.tracksRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return tracks.map(this.toResponse);
  }

  private toResponse = (track: Track) => {
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      genre: track.genre,
      mood: track.mood,
      key: track.key,
      bpm: track.bpm,
      durationSec: track.durationSec,
      audioUrl: track.audioUrl ?? null,
      previewUrl: track.previewUrl ?? null,
      cover: track.coverGradient,
      status:
        track.status === TrackStatus.PUBLISHED
          ? 'Published'
          : track.status === TrackStatus.TAKEN_DOWN
            ? 'Taken down'
            : 'Draft',
      streams: track.streams,
      revenueGbp: track.revenueGbp,
      releasedAt: track.releasedAt?.toISOString().slice(0, 10) ?? null,
    };
  };
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Clip, ClipStatus } from './entities/clip.entity';
import { GenerateClipDto } from './dto/generate-clip.dto';
import { User } from '../auth/entities/user.entity';
import { ClipJobPayload } from '../worker/clip.processor';

@Injectable()
export class ClipsService {
  constructor(
    @InjectRepository(Clip) private clipsRepo: Repository<Clip>,
    @InjectQueue('clip-processing') private clipQueue: Queue,
  ) {}

  async generate(dto: GenerateClipDto, user: User) {
    const clip = this.clipsRepo.create({
      userId: user.id,
      title: dto.title ?? this.titleFromPrompt(dto.prompt),
      prompt: dto.prompt,
      genre: dto.genre,
      mood: dto.mood,
      bpm: dto.bpm ?? 120,
      instruments: dto.instruments,
      status: ClipStatus.PENDING,
    });
    await this.clipsRepo.save(clip);

    const payload: ClipJobPayload = {
      clipId: clip.id,
      userId: user.id,
      prompt: dto.prompt,
      genre: dto.genre,
      mood: dto.mood,
      bpm: dto.bpm,
      instruments: dto.instruments,
    };

    await this.clipQueue.add('generate-clip', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return { clipId: clip.id, status: ClipStatus.PENDING };
  }

  async findMine(userId: string) {
    const clips = await this.clipsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return clips.map(this.toResponse);
  }

  async findOne(id: string, userId: string) {
    const clip = await this.clipsRepo.findOneBy({ id });
    if (!clip) throw new NotFoundException('Clip not found');
    if (clip.userId !== userId) throw new ForbiddenException();
    return this.toResponse(clip);
  }

  private titleFromPrompt(prompt: string): string {
    const words = prompt.trim().split(/\s+/).slice(0, 4).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  private toResponse = (clip: Clip) => ({
    id: clip.id,
    title: clip.title,
    genre: clip.genre ?? '—',
    mood: clip.mood ?? null,
    bpm: clip.bpm ?? 120,
    audioUrl: clip.audioUrl ?? null,
    status: clip.status,
    createdAt: clip.createdAt,
  });
}

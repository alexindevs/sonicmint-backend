import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Track } from '../tracks/entities/track.entity';
import { StreamEvent } from '../tracks/entities/stream-event.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(Track) private tracksRepo: Repository<Track>,
    @InjectRepository(StreamEvent)
    private streamEventsRepo: Repository<StreamEvent>,
    private configService: ConfigService,
  ) {}

  async getTracks(userId: string) {
    const tracks = await this.tracksRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      genre: t.genre,
      mood: t.mood,
      key: t.key,
      bpm: t.bpm,
      durationSec: t.durationSec,
      audioUrl: t.audioUrl ?? null,
      previewUrl: t.previewUrl ?? null,
      cover: t.coverGradient,
      status: t.status === 'PUBLISHED' ? 'Published' : t.status === 'TAKEN_DOWN' ? 'Taken down' : 'Draft',
      streams: t.streams,
      revenueGbp: t.revenueGbp,
      releasedAt: t.releasedAt?.toISOString().slice(0, 10) ?? null,
    }));
  }

  async getStats(userId: string) {
    const tracks = await this.tracksRepo.find({ where: { userId } });

    const totalStreams = tracks.reduce((sum, t) => sum + t.streams, 0);
    const totalRevenueGbp = tracks.reduce((sum, t) => sum + t.revenueGbp, 0);

    const royaltyRate = this.configService.get<number>('revenue.royaltyRateGbp') ?? 0.004;
    const platformFee = this.configService.get<number>('revenue.platformFeePct') ?? 15;
    const pendingPayoutGbp = parseFloat(
      (totalStreams * royaltyRate * (1 - platformFee / 100)).toFixed(2),
    );

    const topTrack = tracks.reduce(
      (top, t) => (!top || t.streams > top.streams ? t : top),
      null as Track | null,
    );

    const streamHistory = await this.getStreamHistory(
      tracks.map((t) => t.id),
    );

    return {
      totalStreams,
      totalRevenueGbp: parseFloat(totalRevenueGbp.toFixed(2)),
      pendingPayoutGbp,
      topTrack: topTrack
        ? { id: topTrack.id, title: topTrack.title, streams: topTrack.streams }
        : null,
      streamHistory,
    };
  }

  async getPayout(user: User) {
    const tracks = await this.tracksRepo.find({ where: { userId: user.id } });
    const totalStreams = tracks.reduce((sum, t) => sum + t.streams, 0);

    const royaltyRate = this.configService.get<number>('revenue.royaltyRateGbp') ?? 0.004;
    const platformFee = this.configService.get<number>('revenue.platformFeePct') ?? 15;
    const totalEarned = totalStreams * royaltyRate * (1 - platformFee / 100);

    const nextPayoutDate = new Date();
    nextPayoutDate.setDate(nextPayoutDate.getDate() + (7 - nextPayoutDate.getDay()));

    return {
      stripeConnected: user.stripeOnboarded,
      pendingGbp: parseFloat((totalEarned * 0.3).toFixed(2)),
      availableGbp: parseFloat((totalEarned * 0.7).toFixed(2)),
      nextPayoutDate: nextPayoutDate.toISOString().slice(0, 10),
    };
  }

  private async getStreamHistory(trackIds: string[]) {
    if (!trackIds.length) {
      return Array.from({ length: 30 }, (_, i) => ({ day: `Day ${i + 1}`, streams: 0 }));
    }

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const rows = await this.streamEventsRepo
      .createQueryBuilder('se')
      .select("DATE(se.timestamp)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('se.trackId IN (:...trackIds)', { trackIds })
      .andWhere('se.timestamp >= :since', { since })
      .groupBy('DATE(se.timestamp)')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    const byDate = new Map(rows.map((r) => [r.date, parseInt(r.count, 10)]));

    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      return { day: `Day ${i + 1}`, streams: byDate.get(key) ?? 0 };
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track, TrackStatus } from '../tracks/entities/track.entity';
import { Report, ReportStatus } from '../reports/entities/report.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Track) private tracksRepo: Repository<Track>,
    @InjectRepository(Report) private reportsRepo: Repository<Report>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async getStats() {
    const [totalTracks, totalUsers, totalReports, openReports] =
      await Promise.all([
        this.tracksRepo.count(),
        this.usersRepo.count(),
        this.reportsRepo.count(),
        this.reportsRepo.count({ where: { status: ReportStatus.OPEN } }),
      ]);

    const revenueResult = await this.tracksRepo
      .createQueryBuilder('t')
      .select('SUM(t.revenueGbp)', 'total')
      .getRawOne<{ total: string }>();

    return {
      totalTracks,
      totalUsers,
      totalReports,
      openReports,
      totalRevenueGbp: parseFloat(revenueResult?.total ?? '0'),
    };
  }

  async getReports(status?: ReportStatus) {
    return this.reportsRepo.find({
      where: status ? { status } : {},
      relations: { track: true, reporter: true },
      order: { createdAt: 'DESC' },
    });
  }

  async takedownTrack(reportId: string, adminId: string) {
    const report = await this.reportsRepo.findOne({
      where: { id: reportId },
      relations: { track: true },
    });
    if (!report) throw new NotFoundException('Report not found');

    await this.tracksRepo.update(report.trackId, {
      status: TrackStatus.TAKEN_DOWN,
    });
    await this.reportsRepo.update(reportId, {
      status: ReportStatus.TAKEN_DOWN,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    });

    return { message: 'Track taken down' };
  }

  async dismissReport(reportId: string, adminId: string) {
    const report = await this.reportsRepo.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    await this.reportsRepo.update(reportId, {
      status: ReportStatus.DISMISSED,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    });

    return { message: 'Report dismissed' };
  }

  async getUsers() {
    return this.usersRepo.find({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        stripeOnboarded: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getSignupStats(weeks = 8) {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);
    since.setHours(0, 0, 0, 0);

    const rows = await this.usersRepo
      .createQueryBuilder('u')
      .select("DATE_TRUNC('week', u.createdAt)", 'week')
      .addSelect('COUNT(*)', 'count')
      .where('u.createdAt >= :since', { since })
      .groupBy("DATE_TRUNC('week', u.createdAt)")
      .orderBy('week', 'ASC')
      .getRawMany<{ week: string; count: string }>();

    return Array.from({ length: weeks }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (weeks - 1 - i) * 7);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toISOString().slice(0, 10);
      const match = rows.find((r) => r.week.slice(0, 10) === key);
      return {
        week: `W${i + 1}`,
        signups: match ? parseInt(match.count, 10) : 0,
      };
    });
  }
}

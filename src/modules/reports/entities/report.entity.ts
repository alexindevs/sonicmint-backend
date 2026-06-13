import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Track } from '../../tracks/entities/track.entity';
import { User } from '../../auth/entities/user.entity';

export enum ReportStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
  TAKEN_DOWN = 'TAKEN_DOWN',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trackId: string;

  @ManyToOne(() => Track, (t) => t.reports)
  @JoinColumn({ name: 'trackId' })
  track: Track;

  @Column()
  reporterId: string;

  @ManyToOne(() => User, (u) => u.reports)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column()
  reason: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.OPEN })
  status: ReportStatus;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

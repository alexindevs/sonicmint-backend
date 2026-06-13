import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { AudioJob } from './audio-job.entity';
import { StreamEvent } from './stream-event.entity';
import { Report } from '../../reports/entities/report.entity';

export enum TrackStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  TAKEN_DOWN = 'TAKEN_DOWN',
}

@Entity('tracks')
export class Track {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column()
  genre: string;

  @Column()
  mood: string;

  @Column()
  key: string;

  @Column()
  bpm: number;

  @Column()
  durationSec: number;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ nullable: true })
  previewUrl: string;

  @Column()
  coverGradient: string;

  @Column({ type: 'enum', enum: TrackStatus, default: TrackStatus.DRAFT })
  status: TrackStatus;

  @Column({ default: 0 })
  streams: number;

  @Column({ type: 'float', default: 0 })
  revenueGbp: number;

  @Column({ nullable: true })
  releasedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.tracks)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => AudioJob, (aj) => aj.track)
  audioJob: AudioJob;

  @OneToMany(() => StreamEvent, (se) => se.track)
  streamEvents: StreamEvent[];

  @OneToMany(() => Report, (r) => r.track)
  reports: Report[];
}

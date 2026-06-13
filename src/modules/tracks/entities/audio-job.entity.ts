import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Track } from './track.entity';

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Entity('audio_jobs')
export class AudioJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trackId: string;

  @OneToOne(() => Track, (t) => t.audioJob)
  @JoinColumn({ name: 'trackId' })
  track: Track;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;

  @Column()
  s3RawKey: string;

  @Column({ nullable: true })
  s3Mp3Key: string;

  @Column({ nullable: true })
  s3PreviewKey: string;

  @Column({ nullable: true })
  errorMsg: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

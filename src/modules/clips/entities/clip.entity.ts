import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ClipStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Entity('clips')
export class Clip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  title: string;

  @Column()
  prompt: string;

  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  mood: string;

  @Column({ nullable: true })
  bpm: number;

  @Column({ type: 'text', array: true, nullable: true })
  instruments: string[];

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ type: 'enum', enum: ClipStatus, default: ClipStatus.PENDING })
  status: ClipStatus;

  @Column({ nullable: true })
  errorMsg: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

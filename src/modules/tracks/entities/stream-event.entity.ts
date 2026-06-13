import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Track } from './track.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('stream_events')
export class StreamEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trackId: string;

  @ManyToOne(() => Track, (t) => t.streamEvents)
  @JoinColumn({ name: 'trackId' })
  track: Track;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, (u) => u.streamEvents, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  durationSec: number;
}

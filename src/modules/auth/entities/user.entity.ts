import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { Track } from '../../tracks/entities/track.entity';
import { Report } from '../../reports/entities/report.entity';
import { StreamEvent } from '../../tracks/entities/stream-event.entity';

export enum Role {
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'enum', enum: Role, default: Role.CREATOR })
  role: Role;

  @Column({ nullable: true })
  stripeAccountId: string;

  @Column({ default: false })
  stripeOnboarded: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => Track, (t) => t.user)
  tracks: Track[];

  @OneToMany(() => Report, (r) => r.reporter)
  reports: Report[];

  @OneToMany(() => StreamEvent, (se) => se.user)
  streamEvents: StreamEvent[];
}

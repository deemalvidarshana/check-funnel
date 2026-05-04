import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Client } from '../../client/client.entity';
import { TrackedAccount } from './tracked-account.entity';

@Entity()
@Index('idx_smp_client_platform', ['clientId', 'platform', 'accountType'])
@Index('idx_smp_created_at', ['createdAt'])
export class SocialMediaPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  trackedAccountId: number;

  @ManyToOne(() => TrackedAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trackedAccountId' })
  trackedAccount: TrackedAccount;

  @Column({ length: 20 })
  platform: string;

  @Column({ length: 20 })
  accountType: string;

  // Common Metrics
  @Column({ length: 255, nullable: true })
  postId: string;

  @Column({ type: 'text', nullable: true })
  postUrl: string;

  @Column({ type: 'datetime', nullable: true })
  createdAt: Date;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  shares: number;

  // Full raw data from extension CSV
  @Column({ type: 'json', nullable: true })
  rawExtensionData: any;

  @CreateDateColumn()
  uploadedAt: Date;
}

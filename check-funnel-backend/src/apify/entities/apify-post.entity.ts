import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Client } from '../../client/client.entity';
import { ApifyTrackedAccount } from './apify-tracked-account.entity';

@Entity('apify_social_media_posts')
@Index('idx_apify_client_platform', ['clientId', 'platform'])
@Index('idx_apify_created_at', ['createdAt'])
export class ApifyPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  apifyTrackedAccountId: number;

  @ManyToOne(() => ApifyTrackedAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'apifyTrackedAccountId' })
  trackedAccount: ApifyTrackedAccount;

  @Column({ length: 20 })
  platform: string;

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

  @Column({ type: 'text', nullable: true })
  caption: string;

  @Column({ type: 'json', nullable: true })
  media: any;

  @Column({ type: 'json', nullable: true })
  reactions: any;

  @Column({ type: 'json', nullable: true })
  rawData: any;

  @Column({ length: 100, nullable: true })
  syncRangeLabel: string;

  @CreateDateColumn()
  fetchedAt: Date;
}

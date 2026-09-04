import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'longblob', nullable: true })
  logoData: Buffer | null;

  @Column({ type: 'int', default: 30 })
  monthlyTargetPosts: number;

  @Column({ type: 'simple-array', nullable: true })
  hashtags: string[];

  @Column({ nullable: true })
  shortDescription: string;

  @Column()
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ type: 'int', nullable: true })
  responsiblePersonId: number | null;

  @Column({ type: 'varchar', nullable: true })
  responsiblePersonName: string | null;

  @Column({ type: 'simple-array', nullable: true })
  activeChannels: string[];

  @Column({ nullable: true })
  facebookApiKey: string;

  @Column({ nullable: true })
  facebookPageId: string;

  @Column({ type: 'varchar', nullable: true })
  metaAdAccountId: string | null;

  @Column({ type: 'text', nullable: true })
  metaAdsAccessToken: string | null;

  @Column({ nullable: true })
  instagramApiKey: string;

  @Column({ nullable: true })
  instagramAccountId: string;

  @Column({ type: 'varchar', nullable: true })
  facebookUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  instagramUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  tiktokUrl: string | null;

  @Column({ nullable: true })
  tiktokApiKey: string;

  @Column({ nullable: true })
  tiktokClientKey: string;

  @Column({ nullable: true })
  tiktokClientSecret: string;

  @Column({ nullable: true })
  tiktokRefreshToken: string;

  @Column({ type: 'varchar', nullable: true })
  googleAnalyticsAccountId: string | null;

  @Column({ type: 'varchar', nullable: true })
  googleAnalyticsAccountName: string | null;

  @Column({ type: 'varchar', nullable: true })
  googleAnalyticsPropertyId: string | null;

  @Column({ type: 'varchar', nullable: true })
  googleAnalyticsPropertyName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ unique: true, nullable: true })
  shareToken: string;

  @Column({ default: false })
  isShared: boolean;
}

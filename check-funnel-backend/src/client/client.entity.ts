import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ type: 'simple-array', nullable: true })
  activeChannels: string[];

  @Column({ nullable: true })
  facebookApiKey: string;

  @Column({ nullable: true })
  facebookPageId: string;

  @Column({ nullable: true })
  instagramApiKey: string;

  @Column({ nullable: true })
  instagramAccountId: string;

  @Column({ nullable: true })
  tiktokApiKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ unique: true, nullable: true })
  shareToken: string;

  @Column({ default: false })
  isShared: boolean;
}

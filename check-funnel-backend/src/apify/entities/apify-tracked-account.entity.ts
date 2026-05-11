import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../../client/client.entity';

@Entity('apify_tracked_accounts')
export class ApifyTrackedAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ length: 20 })
  platform: string; // 'facebook', etc.

  @Column({ type: 'text', nullable: true })
  url: string; // The URL used for Apify input

  @Column({ length: 150, nullable: true })
  username: string; // pageName or user name from output

  @Column({ length: 200, nullable: true })
  displayName: string;

  @Column({ length: 20, default: 'competitor' })
  accountType: string; // 'client' | 'competitor'

  @Column({ type: 'int', default: 0 })
  followerCount: number;

  @Column({ type: 'text', nullable: true })
  profilePicUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

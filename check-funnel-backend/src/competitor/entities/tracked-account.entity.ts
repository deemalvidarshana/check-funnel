import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../../client/client.entity';

@Entity()
export class TrackedAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ length: 20 })
  platform: string; // 'tiktok' | 'facebook' | 'instagram'

  @Column({ length: 150 })
  username: string;

  @Column({ length: 200, nullable: true })
  displayName: string;

  @Column({ length: 20 })
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

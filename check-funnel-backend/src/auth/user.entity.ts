import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column({ default: 'viewer' })
  role: string;

  @Column({ default: 'pending' })
  status: string; // 'pending' | 'approved' | 'rejected'

  @Column({ nullable: true })
  processedByEmail: string;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ type: 'longblob', nullable: true })
  avatarData: Buffer;

  @Column({ nullable: true })
  avatarMimeType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
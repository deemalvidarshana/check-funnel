import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('target_snapshots')
export class TargetSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  platform: string;

  @Column()
  targetMonth: string;

  @Column({ nullable: true })
  generatedMonth: string;

  @Column({ type: 'int', nullable: true })
  scopeClientId: number | null;

  @Column({ type: 'simple-json' })
  rows: any[];

  @Column({ type: 'datetime' })
  generatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  finalizedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

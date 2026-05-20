import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CalendarSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  clientId: number;

  @Column({ type: 'simple-json' })
  configData: any;

  @Column({ type: 'text', nullable: true })
  prompt: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

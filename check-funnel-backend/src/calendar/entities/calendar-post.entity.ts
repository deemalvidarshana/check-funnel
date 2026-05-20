import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Calendar } from './calendar.entity';

@Entity()
export class CalendarPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column({ nullable: true })
  time: string;

  @Column()
  contentType: string;

  @Column()
  pillar: string;

  @Column({ type: 'text' })
  visualCopy: string;

  @Column({ type: 'text' })
  caption: string;

  @Column({ type: 'text', nullable: true })
  reelScript: string;

  @Column({ type: 'simple-json', nullable: true })
  platforms: string[];

  @Column({ nullable: true })
  fbLink: string;

  @Column({ nullable: true })
  igLink: string;

  @Column({ nullable: true })
  ttLink: string;

  @Column({ default: 'DRAFT' })
  status: string;

  @ManyToOne(() => Calendar, (calendar) => calendar.posts, {
    onDelete: 'CASCADE',
  })
  calendar: Calendar;
}

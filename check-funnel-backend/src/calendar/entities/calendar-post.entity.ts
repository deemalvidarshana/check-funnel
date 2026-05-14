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

  @Column({ default: 'DRAFT' })
  status: string;

  @ManyToOne(() => Calendar, (calendar) => calendar.posts, { onDelete: 'CASCADE' })
  calendar: Calendar;
}

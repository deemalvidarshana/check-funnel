import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { CalendarPost } from './calendar-post.entity';

@Entity()
export class Calendar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @Column()
  name: string;

  @Column()
  month: string;

  @Column()
  year: number;

  @Column({ type: 'simple-json', nullable: true })
  competitors: any;

  @Column({ type: 'text', nullable: true })
  promptUsed: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @OneToMany(() => CalendarPost, (post) => post.calendar, { cascade: true })
  posts: CalendarPost[];
}

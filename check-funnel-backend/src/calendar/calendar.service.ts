import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendar } from './entities/calendar.entity';
import { CalendarPost } from './entities/calendar-post.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarPost)
    private calendarPostRepository: Repository<CalendarPost>,
  ) {}

  async createCalendar(data: any, userEmail: string): Promise<Calendar> {
    console.log('--- Creating Calendar ---');
    console.log('Incoming Data:', JSON.stringify(data, null, 2));
    
    const { clientId, name, month, year, competitors, promptUsed, posts } = data;

    try {
      const calendar = this.calendarRepository.create({
        clientId: Number(clientId),
        name,
        month,
        year: Number(year),
        competitors,
        promptUsed,
        createdBy: userEmail,
      });

      const savedCalendar = await this.calendarRepository.save(calendar);
      console.log('Saved Calendar ID:', savedCalendar.id);

      if (posts && posts.length > 0) {
        console.log(`Saving ${posts.length} posts...`);
        const calendarPosts = posts.map((post: any) =>
          this.calendarPostRepository.create({
            date: post.date || '',
            contentType: post.contentType || post.type || '',
            pillar: post.pillar || '',
            visualCopy: post.visualCopy || post.visual || '',
            caption: post.caption || '',
            status: post.status || 'DRAFT',
            calendar: savedCalendar,
          }),
        );
        await this.calendarPostRepository.save(calendarPosts);
        console.log('All posts saved successfully.');
      }

      return savedCalendar;
    } catch (error) {
      console.error('Error in createCalendar:', error);
      throw error;
    }
  }

  async getCalendars(clientId?: number): Promise<Calendar[]> {
    const query = this.calendarRepository.createQueryBuilder('calendar')
      .leftJoinAndSelect('calendar.posts', 'posts')
      .orderBy('calendar.createdAt', 'DESC');

    if (clientId) {
      query.where('calendar.clientId = :clientId', { clientId });
    }

    return query.getMany();
  }

  async getCalendarById(id: number): Promise<Calendar | null> {
    return this.calendarRepository.findOne({
      where: { id },
      relations: ['posts'],
    });
  }
}

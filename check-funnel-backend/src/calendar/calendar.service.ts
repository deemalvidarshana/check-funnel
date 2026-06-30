import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendar } from './entities/calendar.entity';
import { CalendarPost } from './entities/calendar-post.entity';
import { CalendarSettings } from './entities/calendar-settings.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarPost)
    private calendarPostRepository: Repository<CalendarPost>,
    @InjectRepository(CalendarSettings)
    private calendarSettingsRepository: Repository<CalendarSettings>,
  ) {}

  async getSettings(clientId: number): Promise<CalendarSettings | null> {
    return this.calendarSettingsRepository.findOne({
      where: { clientId: Number(clientId) },
    });
  }

  async upsertSettings(
    clientId: number,
    data: any,
    userEmail: string,
  ): Promise<CalendarSettings> {
    const normalizedClientId = Number(clientId);
    const configData = data.configData || data.formData || {};
    const prompt = data.prompt ?? configData.prompt ?? null;

    const existingSettings = await this.calendarSettingsRepository.findOne({
      where: { clientId: normalizedClientId },
    });

    if (existingSettings) {
      existingSettings.configData = configData;
      existingSettings.prompt = prompt;
      existingSettings.updatedBy = userEmail;
      return this.calendarSettingsRepository.save(existingSettings);
    }

    const settings = this.calendarSettingsRepository.create({
      clientId: normalizedClientId,
      configData,
      prompt,
      createdBy: userEmail,
      updatedBy: userEmail,
    });

    return this.calendarSettingsRepository.save(settings);
  }

  private normalizePlatforms(platforms: any): string[] {
    if (Array.isArray(platforms)) {
      return platforms
        .map((platform) => String(platform).trim().toLowerCase())
        .filter(Boolean);
    }

    if (typeof platforms === 'string') {
      return platforms
        .split(',')
        .map((platform) => platform.trim().toLowerCase())
        .filter(Boolean);
    }

    return [];
  }

  private buildCalendarPost(
    post: any,
    calendar: Calendar,
    fallbackSortOrder = 0,
  ) {
    return this.calendarPostRepository.create({
      date: post.date || '',
      time: post.time || '',
      sortOrder: Number.isFinite(Number(post.sortOrder))
        ? Number(post.sortOrder)
        : fallbackSortOrder,
      contentType: post.contentType || post.type || '',
      pillar: post.pillar || '',
      visualCopy: post.visualCopy || post.visual || '',
      caption: post.caption || '',
      reelScript: post.reelScript || '',
      platforms: this.normalizePlatforms(post.platforms),
      fbLink: post.fbLink || post.facebookLink || '',
      igLink: post.igLink || post.instagramLink || '',
      ttLink: post.ttLink || post.tiktokLink || '',
      status: post.status || 'DRAFT',
      calendar,
    });
  }

  async createCalendar(data: any, userEmail: string): Promise<Calendar> {
    console.log('--- Creating Calendar ---');
    console.log('Incoming Data:', JSON.stringify(data, null, 2));

    const { clientId, name, month, year, competitors, promptUsed, posts } =
      data;

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
        const calendarPosts = posts.map((post: any, index: number) =>
          this.buildCalendarPost(post, savedCalendar, index),
        );
        savedCalendar.posts = await this.calendarPostRepository.save(calendarPosts);
        console.log('All posts saved successfully.');
      }

      return savedCalendar;
    } catch (error) {
      console.error('Error in createCalendar:', error);
      throw error;
    }
  }

  async getCalendars(clientId?: number): Promise<Calendar[]> {
    const query = this.calendarRepository
      .createQueryBuilder('calendar')
      .leftJoinAndSelect('calendar.posts', 'posts')
      .orderBy('calendar.createdAt', 'DESC')
      .addOrderBy('posts.sortOrder', 'ASC')
      .addOrderBy('posts.id', 'ASC');

    if (clientId) {
      query.where('calendar.clientId = :clientId', { clientId });
    }

    return query.getMany();
  }

  async getCalendarById(id: number): Promise<Calendar | null> {
    return this.calendarRepository
      .createQueryBuilder('calendar')
      .leftJoinAndSelect('calendar.posts', 'posts')
      .where('calendar.id = :id', { id })
      .orderBy('posts.sortOrder', 'ASC')
      .addOrderBy('posts.id', 'ASC')
      .getOne();
  }

  async createPost(calendarId: number, data: any): Promise<CalendarPost> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: Number(calendarId) },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    const post = this.buildCalendarPost(data, calendar);
    return this.calendarPostRepository.save(post);
  }

  async deleteCalendar(id: number): Promise<void> {
    await this.calendarRepository.delete(id);
  }

  async deletePost(id: number): Promise<void> {
    await this.calendarPostRepository.delete(id);
  }

  async updatePost(
    id: number,
    data: Partial<CalendarPost>,
  ): Promise<CalendarPost | null> {
    const updateData = {
      ...data,
      ...(data.platforms !== undefined
        ? { platforms: this.normalizePlatforms(data.platforms) }
        : {}),
    };

    await this.calendarPostRepository.update(id, updateData);
    return this.calendarPostRepository.findOne({ where: { id } });
  }
}

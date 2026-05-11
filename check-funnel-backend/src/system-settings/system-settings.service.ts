import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-settings.entity';

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSettings)
    private systemSettingsRepository: Repository<SystemSettings>,
  ) {}

  async onModuleInit() {
    // Ensure at least one row exists
    const count = await this.systemSettingsRepository.count();
    if (count === 0) {
      const settings = this.systemSettingsRepository.create({
        apifyApiKey: '',
        competitorAnalyzeMethod: 'upload',
        apifyDefaultResultsLimit: 100,
        lastModifiedBy: 'System',
      });
      await this.systemSettingsRepository.save(settings);
    }
  }

  async getSettings(): Promise<SystemSettings> {
    const settings = await this.systemSettingsRepository.find();
    return settings[0];
  }

  async updateSettings(
    updateData: { apifyApiKey?: string; competitorAnalyzeMethod?: string; apifyDefaultResultsLimit?: number },
    adminEmail: string,
  ): Promise<SystemSettings> {
    const settings = await this.getSettings();
    if (updateData.apifyApiKey !== undefined) {
      settings.apifyApiKey = updateData.apifyApiKey;
    }
    if (updateData.competitorAnalyzeMethod !== undefined) {
      settings.competitorAnalyzeMethod = updateData.competitorAnalyzeMethod;
    }
    if (updateData.apifyDefaultResultsLimit !== undefined) {
      settings.apifyDefaultResultsLimit = updateData.apifyDefaultResultsLimit;
    }
    settings.lastModifiedBy = adminEmail;
    return this.systemSettingsRepository.save(settings);
  }
}

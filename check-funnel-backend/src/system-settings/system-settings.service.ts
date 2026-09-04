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
        openRouterApiKey: '',
        openRouterModel: 'google/gemini-2.0-flash-001',
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
    updateData: { 
      apifyApiKey?: string; 
      openRouterApiKey?: string;
      openRouterModel?: string;
      competitorAnalyzeMethod?: string; 
      apifyDefaultResultsLimit?: number;
      googleAnalyticsProjectId?: string;
      googleAnalyticsClientId?: string;
      googleAnalyticsClientSecret?: string;
      googleAnalyticsLocalRedirectUri?: string;
      googleAnalyticsProductionRedirectUri?: string;
    },
    adminEmail: string,
  ): Promise<SystemSettings> {
    const settings = await this.getSettings();
    if (updateData.apifyApiKey !== undefined) {
      settings.apifyApiKey = updateData.apifyApiKey;
    }
    if (updateData.openRouterApiKey !== undefined) {
      settings.openRouterApiKey = updateData.openRouterApiKey;
    }
    if (updateData.openRouterModel !== undefined) {
      settings.openRouterModel = updateData.openRouterModel;
    }
    if (updateData.competitorAnalyzeMethod !== undefined) {
      settings.competitorAnalyzeMethod = updateData.competitorAnalyzeMethod;
    }
    if (updateData.apifyDefaultResultsLimit !== undefined) {
      settings.apifyDefaultResultsLimit = updateData.apifyDefaultResultsLimit;
    }
    if (updateData.googleAnalyticsProjectId !== undefined) settings.googleAnalyticsProjectId = updateData.googleAnalyticsProjectId || null;
    if (updateData.googleAnalyticsClientId !== undefined) settings.googleAnalyticsClientId = updateData.googleAnalyticsClientId || null;
    if (updateData.googleAnalyticsClientSecret) settings.googleAnalyticsClientSecret = updateData.googleAnalyticsClientSecret;
    if (updateData.googleAnalyticsLocalRedirectUri !== undefined) settings.googleAnalyticsLocalRedirectUri = updateData.googleAnalyticsLocalRedirectUri || null;
    if (updateData.googleAnalyticsProductionRedirectUri !== undefined) settings.googleAnalyticsProductionRedirectUri = updateData.googleAnalyticsProductionRedirectUri || null;
    settings.lastModifiedBy = adminEmail;
    return this.systemSettingsRepository.save(settings);
  }

  async saveGoogleTokens(data: { accessToken: string; refreshToken?: string; expiresAt: Date; connectedEmail?: string }) {
    const settings = await this.getSettings();
    settings.googleAnalyticsAccessToken = data.accessToken;
    if (data.refreshToken) settings.googleAnalyticsRefreshToken = data.refreshToken;
    settings.googleAnalyticsTokenExpiresAt = data.expiresAt;
    settings.googleAnalyticsConnectedEmail = data.connectedEmail || null;
    return this.systemSettingsRepository.save(settings);
  }
}

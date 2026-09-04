import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemSettingsService } from './system-settings.service';

@Controller('system-settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  private canManageSettings(req: any) {
    const user = req.user;
    return (
      user?.role === 'admin' ||
      (user?.role === 'manager' &&
        Array.isArray(user?.featureAccess) &&
        (user.featureAccess.includes('contentCalendar') ||
          user.featureAccess.includes('competitors')))
    );
  }

  private assertCanManageSettings(req: any) {
    if (!this.canManageSettings(req)) {
      throw new ForbiddenException('You do not have permission to manage settings');
    }
  }

  private restrictForManager(settings: any, req: any) {
    if (req.user?.role === 'admin') return this.safeSettings(settings);
    if (req.user?.featureAccess?.includes('competitors')) {
      const { apifyApiKey, competitorAnalyzeMethod, lastModifiedBy, updatedAt } = settings;
      return { apifyApiKey, competitorAnalyzeMethod, lastModifiedBy, updatedAt };
    }
    const { openRouterApiKey, openRouterModel, lastModifiedBy, updatedAt } = settings;
    return { openRouterApiKey, openRouterModel, lastModifiedBy, updatedAt };
  }

  private safeSettings(settings: any) {
    const safe = { ...settings };
    safe.googleAnalyticsClientSecret = '';
    delete safe.googleAnalyticsAccessToken;
    delete safe.googleAnalyticsRefreshToken;
    safe.googleAnalyticsClientSecretConfigured = Boolean(settings.googleAnalyticsClientSecret);
    safe.googleAnalyticsConnected = Boolean(settings.googleAnalyticsRefreshToken || settings.googleAnalyticsAccessToken);
    return safe;
  }

  @Get()
  @Roles('admin', 'manager')
  async getSettings(@Request() req) {
    this.assertCanManageSettings(req);
    const settings = await this.systemSettingsService.getSettings();
    return this.restrictForManager(settings, req);
  }

  @Patch()
  @Roles('admin', 'manager')
  async updateSettings(
    @Body()
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
    @Request() req,
  ) {
    this.assertCanManageSettings(req);

    const allowedUpdate =
      req.user?.role === 'admin'
        ? updateData
        : req.user?.featureAccess?.includes('competitors')
          ? {
              apifyApiKey: updateData.apifyApiKey,
              competitorAnalyzeMethod: updateData.competitorAnalyzeMethod,
            }
          : {
            openRouterApiKey: updateData.openRouterApiKey,
            openRouterModel: updateData.openRouterModel,
          };

    const settings = await this.systemSettingsService.updateSettings(
      allowedUpdate,
      req.user.email,
    );
    return this.restrictForManager(settings, req);
  }
}

import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemSettingsService } from './system-settings.service';

@Controller('system-settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @Roles('admin')
  async getSettings() {
    return this.systemSettingsService.getSettings();
  }

  @Patch()
  @Roles('admin')
  async updateSettings(
    @Body() updateData: { apifyApiKey?: string; competitorAnalyzeMethod?: string; apifyDefaultResultsLimit?: number },
    @Request() req,
  ) {
    return this.systemSettingsService.updateSettings(updateData, req.user.email);
  }
}

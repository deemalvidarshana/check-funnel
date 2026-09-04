import { Module } from '@nestjs/common';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { ClientModule } from '../client/client.module';
import { GoogleAnalyticsController } from './google-analytics.controller';
import { GoogleAnalyticsService } from './google-analytics.service';
import { GoogleAnalyticsReportService } from './google-analytics-report.service';

@Module({
  imports: [SystemSettingsModule, ClientModule],
  controllers: [GoogleAnalyticsController],
  providers: [GoogleAnalyticsService, GoogleAnalyticsReportService],
})
export class GoogleAnalyticsModule {}

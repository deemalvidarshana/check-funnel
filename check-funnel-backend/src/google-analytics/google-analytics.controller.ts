import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GoogleAnalyticsService } from './google-analytics.service';
import { GoogleAnalyticsReportService } from './google-analytics-report.service';

@Controller('google-analytics')
export class GoogleAnalyticsController {
  constructor(
    private readonly service: GoogleAnalyticsService,
    private readonly reportService: GoogleAnalyticsReportService,
    private readonly config: ConfigService,
  ) {}

  @Get('callback')
  @Redirect()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
  ) {
    const frontend =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    if (error) return { url: `${frontend}/clients?googleAnalytics=error` };
    await this.service.exchangeCode(code, state);
    return { url: `${frontend}/clients?googleAnalytics=connected` };
  }

  @Get('auth-url')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  authUrl(@Req() req: any) {
    const host = String(req.headers.host || '');
    return this.service.getAuthUrl(
      host.includes('localhost') || host.includes('127.0.0.1'),
    );
  }

  @Get('accounts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  accounts() {
    return this.service.listAccountSummaries();
  }

  @Get('clients/:id/test')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  testClient(@Param('id', ParseIntPipe) id: number) {
    return this.service.testClient(id);
  }

  @Get('clients/:id/insights')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'viewer')
  insights(
    @Param('id', ParseIntPipe) id: number,
    @Query('month') month: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('compareSince') compareSince?: string,
    @Query('compareUntil') compareUntil?: string,
  ) {
    return this.reportService.getInsights(id, month, {
      since,
      until,
      compareSince,
      compareUntil,
    });
  }
}

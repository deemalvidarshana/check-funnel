import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaidAdsService } from './paid-ads.service';

@Controller('paid-ads')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'viewer')
export class PaidAdsController {
  constructor(private readonly paidAdsService: PaidAdsService) {}

  @Get(':clientId/insights')
  getInsights(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query('month') month: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('compareSince') compareSince?: string,
    @Query('compareUntil') compareUntil?: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.paidAdsService.getInsights(clientId, month, { since, until, compareSince, compareUntil, campaignId });
  }
}

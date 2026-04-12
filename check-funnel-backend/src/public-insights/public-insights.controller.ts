import { Controller, Get, Param, NotFoundException, Query } from '@nestjs/common';
import { ClientService } from '../client/client.service';
import { FacebookService } from '../facebook/facebook.service';
import { InstagramService } from '../instagram/instagram.service';

@Controller('public-insights')
export class PublicInsightsController {
  constructor(
    private readonly clientService: ClientService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
  ) {}

  @Get('info/:shareToken')
  async getPublicInfo(@Param('shareToken') shareToken: string) {
    const client = await this.clientService.findByShareToken(shareToken);
    
    // Normalize and dynamically detect active channels
    const active = Array.isArray(client.activeChannels) 
      ? [...client.activeChannels] 
      : (client.activeChannels as any || "").split(',').filter(Boolean).map(s => s.trim());

    if (client.facebookPageId && client.facebookApiKey && !active.includes('facebook')) {
      active.push('facebook');
    }
    if (client.instagramAccountId && client.instagramApiKey && !active.includes('instagram')) {
      active.push('instagram');
    }

    return {
      name: client.name,
      logoData: client.logoData,
      activeChannels: active,
    };
  }

  @Get('facebook/:shareToken')
  async getFacebookData(
    @Param('shareToken') shareToken: string,
    @Query('since') since: string,
    @Query('until') until: string,
  ) {
    const client = await this.clientService.findByShareToken(shareToken);
    if (!client.facebookPageId || !client.facebookApiKey) {
        throw new NotFoundException('Facebook insights not available for this client');
    }
    return this.facebookService.getInsights({
        pageId: client.facebookPageId,
        accessToken: client.facebookApiKey,
        since,
        until,
    });
  }

  @Get('instagram/:shareToken')
  async getInstagramData(
    @Param('shareToken') shareToken: string,
    @Query('timeRange') timeRange: string,
  ) {
    const client = await this.clientService.findByShareToken(shareToken);
    if (!client.instagramAccountId || !client.instagramApiKey) {
        throw new NotFoundException('Instagram insights not available for this client');
    }
    return this.instagramService.getWeeklyInsights({
        pageId: client.instagramAccountId,
        accessToken: client.instagramApiKey,
        timeRange,
        until: undefined,
    });
  }
}

import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Query,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import * as express from 'express';
import { ClientService } from '../client/client.service';
import { FacebookService } from '../facebook/facebook.service';
import { InstagramService } from '../instagram/instagram.service';
import { TiktokService } from '../tiktok/tiktok.service';
import { CompetitorService } from '../competitor/competitor.service';
import { ApifyService } from '../apify/apify.service';
import { CalendarService } from '../calendar/calendar.service';

@Controller('public-insights')
export class PublicInsightsController {
  constructor(
    private readonly clientService: ClientService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly tiktokService: TiktokService,
    private readonly competitorService: CompetitorService,
    private readonly apifyService: ApifyService,
    private readonly calendarService: CalendarService,
  ) {}

  @Get('info/:shareToken')
  async getPublicInfo(@Param('shareToken') shareToken: string) {
    const client = await this.clientService.findByShareToken(shareToken);

    // Normalize and dynamically detect active channels
    const active = Array.isArray(client.activeChannels)
      ? [...client.activeChannels]
      : ((client.activeChannels as any) || '')
          .split(',')
          .filter(Boolean)
          .map((s) => s.trim());

    if (
      client.facebookPageId &&
      client.facebookApiKey &&
      !active.includes('facebook')
    ) {
      active.push('facebook');
    }
    if (
      client.instagramAccountId &&
      client.instagramApiKey &&
      !active.includes('instagram')
    ) {
      active.push('instagram');
    }
    if (
      client.tiktokApiKey &&
      client.tiktokRefreshToken &&
      !active.includes('tiktok')
    ) {
      active.push('tiktok');
    }

    return {
      name: client.name,
      logoData: !!client.logoData, // Just return if logo exists
      activeChannels: active,
    };
  }

  @Get('logo/:shareToken')
  async getLogo(
    @Param('shareToken') shareToken: string,
    @Res() res: express.Response,
  ) {
    const client = await this.clientService.findByShareToken(shareToken);
    if (!client.logoData) {
      throw new NotFoundException('Logo not found');
    }
    // Simple MIME detection
    res.set('Content-Type', 'image/jpeg');
    res.send(client.logoData);
  }

  @Get('facebook/:shareToken')
  async getFacebookData(
    @Param('shareToken') shareToken: string,
    @Query('since') since: string,
    @Query('until') until: string,
  ) {
    const client = await this.clientService.findByShareToken(shareToken);
    if (!client.facebookPageId || !client.facebookApiKey) {
      throw new NotFoundException(
        'Facebook insights not available for this client',
      );
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
      throw new NotFoundException(
        'Instagram insights not available for this client',
      );
    }
    return this.instagramService.getWeeklyInsights({
      pageId: client.instagramAccountId,
      accessToken: client.instagramApiKey,
      timeRange,
      until: undefined,
    });
  }

  @Get('tiktok/:shareToken')
  async getTiktokData(@Param('shareToken') shareToken: string) {
    const client = await this.clientService.findByShareToken(shareToken);
    if (!client.tiktokApiKey) {
      throw new NotFoundException(
        'TikTok insights not available for this client',
      );
    }

    const insights = await this.tiktokService.getInsights(client);

    // If token was refreshed during fetching, update the database
    if (insights.newAccessToken) {
      await this.clientService.update(client.id, {
        tiktokApiKey: insights.newAccessToken,
      });
    }

    return insights;
  }

  @Get('content-calendars/:shareToken')
  async getPublicContentCalendars(@Param('shareToken') shareToken: string) {
    const client = await this.clientService.findByShareToken(shareToken);
    return this.calendarService.getCalendars(client.id);
  }

  @Get('competitor-summary/:shareToken')
  async getPublicCompetitorSummary(
    @Param('shareToken') shareToken: string,
    @Query('platform') platform?: string,
    @Query('method') method?: string,
  ) {
    const client = await this.clientService.findByShareToken(shareToken);

    if (method === 'apify') {
      return this.apifyService.getSummary(client.id, platform);
    }

    if (method === 'upload') {
      return this.competitorService.getSummaryForClient(client.id, platform);
    }

    // Default: Merge both (Fallback)
    const [apifySummary, csvSummary] = await Promise.all([
      this.apifyService.getSummary(client.id, platform),
      this.competitorService.getSummaryForClient(client.id, platform),
    ]);

    const summaryMap = new Map();
    const addToMap = (items: any[]) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        const username = item.username?.toLowerCase();
        if (!username) return;
        if (!summaryMap.has(username)) {
          summaryMap.set(username, { ...item });
        } else {
          const existing = summaryMap.get(username);
          existing.totalPosts =
            (Number(existing.totalPosts) || 0) + (Number(item.totalPosts) || 0);
          existing.totalViews =
            (Number(existing.totalViews) || 0) + (Number(item.totalViews) || 0);
          existing.totalLikes =
            (Number(existing.totalLikes) || 0) + (Number(item.totalLikes) || 0);
          existing.totalComments =
            (Number(existing.totalComments) || 0) +
            (Number(item.totalComments) || 0);
          existing.totalShares =
            (Number(existing.totalShares) || 0) +
            (Number(item.totalShares) || 0);
          if (
            Number(item.followerCount) > (Number(existing.followerCount) || 0)
          ) {
            existing.followerCount = item.followerCount;
          }
        }
      });
    };

    addToMap(apifySummary);
    addToMap(csvSummary);
    return Array.from(summaryMap.values());
  }

  @Get('competitor-posts/:shareToken')
  async getPublicCompetitorPosts(
    @Param('shareToken') shareToken: string,
    @Query('platform') platform?: string,
    @Query('method') method?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const client = await this.clientService.findByShareToken(shareToken);

    if (method === 'apify') {
      const apifyPosts = await this.apifyService.getPosts(client.id, platform);
      return (apifyPosts || [])
        .map((p) => ({ ...p, trackedAccount: p.trackedAccount || {} }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    if (method === 'upload') {
      const csvPosts = await this.competitorService.getPostsForClient(
        client.id,
        platform,
        from,
        to,
      );
      return (csvPosts || []).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    // Default: Combine and sort (Fallback)
    const [apifyPosts, csvPosts] = await Promise.all([
      this.apifyService.getPosts(client.id, platform),
      this.competitorService.getPostsForClient(client.id, platform, from, to),
    ]);

    const allPosts = [
      ...(apifyPosts || []).map((p) => ({
        ...p,
        trackedAccount: p.trackedAccount || {},
      })),
      ...(csvPosts || []),
    ];

    return allPosts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  @Get('post-details/:shareToken/:postId')
  async getPublicPostDetails(
    @Param('shareToken') shareToken: string,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    const client = await this.clientService.findByShareToken(shareToken);

    // Try Apify first
    try {
      const post = await this.apifyService.getPostById(postId);
      if (post && post.clientId === client.id) return post;
    } catch (e) {
      // Not in Apify
    }

    // Try CSV
    const post = await this.competitorService.getPostById(postId);
    if (post && post.clientId === client.id) return post;

    throw new NotFoundException('Post not found');
  }

  @Get('logo/:shareToken')
  async getPublicLogo(
    @Param('shareToken') shareToken: string,
    @Res() res: express.Response,
  ) {
    const client = await this.clientService.findByShareToken(shareToken);
    if (!client.logoData) {
      throw new NotFoundException('Logo not found');
    }
    // Set appropriate content type
    res.set('Content-Type', 'image/png'); // Default to PNG, or detect from buffer if needed
    res.send(client.logoData);
  }
}

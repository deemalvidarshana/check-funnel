import { Injectable } from '@nestjs/common';
import { format, startOfWeek, subDays } from 'date-fns';
import { ClientService } from './client.service';
import { FacebookService } from '../facebook/facebook.service';
import { InstagramService } from '../instagram/instagram.service';
import { TiktokService } from '../tiktok/tiktok.service';

type DateRange = {
  label: string;
  since: string;
  until: string;
};

type PlatformKey = 'facebook' | 'instagram' | 'tiktok';

@Injectable()
export class ClientInsightsReportService {
  constructor(
    private readonly clientService: ClientService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly tiktokService: TiktokService,
  ) {}

  async buildReport(clientId: number, platform?: string) {
    const client = await this.clientService.findOne(clientId);
    const ranges = {
      weeks10: this.generateLast10Weeks(),
      months6: this.generateLast6Months(),
    };
    const includedPlatforms = this.getIncludedPlatforms(platform);
    const platforms: Record<PlatformKey, any> = {} as Record<PlatformKey, any>;

    await Promise.all(
      includedPlatforms.map(async (platformKey) => {
        platforms[platformKey] = await this.buildPlatformReport(platformKey, client, ranges);
      }),
    );

    return {
      generatedAt: new Date().toISOString(),
      client: this.sanitizeClient(client),
      selectedPlatform: includedPlatforms.length === 1 ? includedPlatforms[0] : null,
      includedPlatforms,
      ranges,
      topics: [
        { key: 'weekly', label: 'Last 10 Weeks', rangeKey: 'weeks10' },
        { key: 'monthly', label: 'Last 6 Months', rangeKey: 'months6' },
      ],
      platforms,
    };
  }

  private getIncludedPlatforms(platform?: string): PlatformKey[] {
    const normalized = String(platform || '').toLowerCase().trim();

    if (['facebook', 'instagram', 'tiktok'].includes(normalized)) {
      return [normalized as PlatformKey];
    }

    return ['facebook', 'instagram', 'tiktok'];
  }

  private buildPlatformReport(platform: PlatformKey, client: any, ranges: { weeks10: DateRange[]; months6: DateRange[] }) {
    if (platform === 'instagram') return this.buildInstagramReport(client, ranges);
    if (platform === 'tiktok') return this.buildTiktokReport(client, ranges);
    return this.buildFacebookReport(client, ranges);
  }

  private async buildFacebookReport(client: any, ranges: { weeks10: DateRange[]; months6: DateRange[] }) {
    if (!client.facebookPageId || !client.facebookApiKey) {
      return this.unavailablePlatform('Facebook', 'Facebook Page ID or API key is missing.');
    }

    const [weekly, monthly] = await Promise.all([
      this.fetchFacebookRows(client, ranges.weeks10),
      this.fetchFacebookRows(client, ranges.months6),
    ]);

    return {
      label: 'Facebook',
      available: true,
      weekly,
      monthly,
    };
  }

  private async fetchFacebookRows(client: any, ranges: DateRange[]) {
    return Promise.all(
      ranges.map((range) =>
        this.facebookService
          .getInsights({
            pageId: client.facebookPageId,
            accessToken: client.facebookApiKey,
            since: range.since,
            until: range.until,
          })
          .then((row) => ({
            ...row,
            week: range.label,
            since: range.since,
            until: range.until,
          }))
          .catch((error) => this.errorRow(range, error)),
      ),
    );
  }

  private async buildInstagramReport(client: any, ranges: { weeks10: DateRange[]; months6: DateRange[] }) {
    if (!client.instagramAccountId || !client.instagramApiKey) {
      return this.unavailablePlatform('Instagram', 'Instagram Account ID or API key is missing.');
    }

    const [weekly, monthly] = await Promise.all([
      this.instagramService
        .getRangeInsights({
          pageId: client.instagramAccountId,
          accessToken: client.instagramApiKey,
          ranges: ranges.weeks10,
        })
        .then((result) => result.weeks || [])
        .catch((error) => ranges.weeks10.map((range) => this.errorRow(range, error))),
      this.instagramService
        .getRangeInsights({
          pageId: client.instagramAccountId,
          accessToken: client.instagramApiKey,
          ranges: ranges.months6,
        })
        .then((result) => result.weeks || [])
        .catch((error) => ranges.months6.map((range) => this.errorRow(range, error))),
    ]);

    return {
      label: 'Instagram',
      available: true,
      weekly,
      monthly,
    };
  }

  private async buildTiktokReport(client: any, ranges: { weeks10: DateRange[]; months6: DateRange[] }) {
    if (!client.tiktokApiKey || !client.tiktokClientKey || !client.tiktokClientSecret) {
      return this.unavailablePlatform('TikTok', 'TikTok credentials are missing or incomplete.');
    }

    try {
      const insights = await this.tiktokService.getInsights(client);

      if (insights.newAccessToken) {
        await this.clientService.update(client.id, { tiktokApiKey: insights.newAccessToken } as any);
      }

      const videos = insights.videos || [];

      return {
        label: 'TikTok',
        available: true,
        user: insights.user || null,
        weekly: this.buildTiktokVideoRows(videos, 10),
        monthly: this.buildTiktokBuckets(videos, ranges.months6),
      };
    } catch (error) {
      return this.unavailablePlatform('TikTok', this.safeErrorMessage(error));
    }
  }

  private buildTiktokVideoRows(videos: any[], limit: number) {
    return [...(videos || [])]
      .sort((a, b) => (Number(b?.create_time) || 0) - (Number(a?.create_time) || 0))
      .slice(0, limit)
      .reverse()
      .map((video, index) => ({
        ...video,
        id: video?.id || video?.video_id || `${video?.create_time || 'video'}-${index}`,
        week: video?.create_time
          ? format(new Date(Number(video.create_time) * 1000), 'dd MMM')
          : `Video ${index + 1}`,
        view_count: Number(video?.view_count) || 0,
        like_count: Number(video?.like_count) || 0,
        comment_count: Number(video?.comment_count) || 0,
        share_count: Number(video?.share_count) || 0,
      }));
  }

  private buildTiktokBuckets(videos: any[], ranges: DateRange[]) {
    return ranges.map((range) => {
      const since = new Date(`${range.since}T00:00:00`).getTime() / 1000;
      const until = new Date(`${range.until}T23:59:59`).getTime() / 1000;
      const bucketVideos = videos.filter((video) => {
        const createdAt = Number(video?.create_time) || 0;
        return createdAt >= since && createdAt <= until;
      });

      return {
        id: `${range.since}-${range.until}`,
        week: range.label,
        since: range.since,
        until: range.until,
        video_count: bucketVideos.length,
        view_count: bucketVideos.reduce((sum, video) => sum + (Number(video?.view_count) || 0), 0),
        like_count: bucketVideos.reduce((sum, video) => sum + (Number(video?.like_count) || 0), 0),
        comment_count: bucketVideos.reduce((sum, video) => sum + (Number(video?.comment_count) || 0), 0),
        share_count: bucketVideos.reduce((sum, video) => sum + (Number(video?.share_count) || 0), 0),
      };
    });
  }

  private generateLast10Weeks() {
    const today = new Date();
    const currentMonday = startOfWeek(today, { weekStartsOn: 1 });
    const ranges: DateRange[] = [
      {
        label: `${format(currentMonday, 'd MMM')} - ${format(today, 'd MMM')}`,
        since: format(currentMonday, 'yyyy-MM-dd'),
        until: format(today, 'yyyy-MM-dd'),
      },
    ];

    let lastMonday = currentMonday;
    for (let index = 0; index < 9; index += 1) {
      const sunday = subDays(lastMonday, 1);
      const monday = subDays(sunday, 6);

      ranges.push({
        label: `${format(monday, 'd MMM')} - ${format(sunday, 'd MMM')}`,
        since: format(monday, 'yyyy-MM-dd'),
        until: format(sunday, 'yyyy-MM-dd'),
      });

      lastMonday = monday;
    }

    return ranges.reverse();
  }

  private generateLast6Months() {
    const today = new Date();
    const ranges: DateRange[] = [];

    for (let index = 0; index < 6; index += 1) {
      const sinceDate = new Date(today.getFullYear(), today.getMonth() - index, 1);
      const untilDate =
        index === 0
          ? today
          : new Date(today.getFullYear(), today.getMonth() - index + 1, 0);

      ranges.push({
        label: `${format(sinceDate, 'd MMM')} - ${format(untilDate, 'd MMM')}`,
        since: format(sinceDate, 'yyyy-MM-dd'),
        until: format(untilDate, 'yyyy-MM-dd'),
      });
    }

    return ranges.reverse();
  }

  private sanitizeClient(client: any) {
    const activeChannels = Array.isArray(client.activeChannels)
      ? client.activeChannels
      : String(client.activeChannels || '')
          .split(',')
          .map((channel) => channel.trim())
          .filter(Boolean);

    return {
      id: client.id,
      name: client.name,
      industry: client.industry,
      activeChannels,
    };
  }

  private unavailablePlatform(label: string, reason: string) {
    return {
      label,
      available: false,
      reason,
      weekly: [],
      monthly: [],
    };
  }

  private errorRow(range: DateRange, error: unknown) {
    return {
      week: range.label,
      since: range.since,
      until: range.until,
      error: true,
      errorMessage: this.safeErrorMessage(error),
    };
  }

  private safeErrorMessage(error: any) {
    const raw =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      'Insights unavailable for this range.';

    return String(raw).replace(/access_token=[^&\s]+/gi, 'access_token=***');
  }
}

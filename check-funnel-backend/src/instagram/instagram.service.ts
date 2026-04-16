import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { format, addDays, subDays, parseISO, isValid, startOfWeek, differenceInDays } from 'date-fns';
import * as https from 'https';
import * as http from 'http';

import { GetIgInsightsDto } from './dto/get-ig-insights.dto';

@Injectable()
export class InstagramService {
  private readonly baseUrl = 'https://graph.facebook.com/v25.0';

  /**
   * Main method to fetch insights dynamically (Weekly or Monthly).
   * Optimized with Promise.all for parallel fetching.
   */
  async getWeeklyInsights(dto: GetIgInsightsDto) {
    const { pageId, accessToken, until, timeRange } = dto;

    try {
      const cleanToken = accessToken ? accessToken.trim() : accessToken;
      const cleanPageId = pageId ? pageId.trim() : pageId;

      const igId = await this.getInstagramId(cleanPageId, cleanToken);
      const pageToken = await this.getPageToken(cleanPageId, cleanToken);
      const cleanPageToken = pageToken ? pageToken.trim() : pageToken;

      const weeks = timeRange === '30' ? this.generateLast6Months(until) : this.generateLast7Weeks(until);

      // Parallelize fetching for all 7 weeks
      const weeksData = await Promise.all(
        weeks.map(week => this.analyseWeek(igId, cleanPageToken, week, cleanToken, cleanPageId))
      );

      return {
        facebook_linked_page_id: pageId,
        instagram_business_id: igId,
        period: "Last 7 Weeks",
        generated_at: new Date().toISOString(),
        api_version: "v25.0",
        metrics_used: {
          posts: "/{ig-id}/media (IMAGE, CAROUSEL_ALBUM, FEED type in timeframe)",
          reels: "/{ig-id}/media (REELS type, or VIDEO type in timeframe)",
          stories: "N/A — 24h Stories expire; historical data unavailable via API",
          views_organic: "IG Insights 'views', breakdown=media_product_type POST+REEL+STORY, until+1 TZ fix",
          views_ads: "IG Insights 'views', breakdown=media_product_type AD bucket, until+1 TZ fix",
          reach_total: "IG Insights 'reach', breakdown=media_product_type, total value, until+1 TZ fix",
          reach_organic: "Total reach minus Ads reach (mirrors Dashboard 'From organic' calculation)",
          reach_ads: "IG Insights 'reach' AD bucket, until+1 TZ fix",
          interactions: "IG Insights 'total_interactions' (likes+comments+shares+sends+...), until+1 TZ fix",
          total_followers: "Profile lifetime followers_count (current total)",
          new_follows: "FB Page 'page_daily_follows_unique' sum using Page Access Token",
          unfollows: "FB Page 'page_daily_unfollows_unique' sum using Page Access Token",
        },
        weeks: weeksData,
      };
    } catch (error) {
      throw new HttpException(error.message || 'Failed to fetch insights', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generates 7 consecutive 7-day intervals ending at the provided 'until' date.
   */
  private generateLast7Weeks(untilStr?: string) {
    let endDate = untilStr ? parseISO(untilStr) : new Date();
    if (!isValid(endDate)) endDate = new Date();

    const weeks: any[] = [];

    // Find most recent Monday
    const currentMonday = startOfWeek(endDate, { weekStartsOn: 1 });

    // 1. Current week from most recent Monday to today/until
    weeks.push({
      label: `${format(currentMonday, 'do MMM')} - ${format(endDate, 'do MMM')}`,
      since: format(currentMonday, 'yyyy-MM-dd'),
      until: format(endDate, 'yyyy-MM-dd'),
    });

    // 2. Previous 6 full Mon-Sun weeks
    let lastMonday = currentMonday;
    for (let i = 0; i < 6; i++) {
      const sun = subDays(lastMonday, 1);
      const mon = subDays(sun, 6);

      weeks.push({
        label: `${format(mon, 'do MMM')} - ${format(sun, 'do MMM')}`,
        since: format(mon, 'yyyy-MM-dd'),
        until: format(sun, 'yyyy-MM-dd'),
      });

      lastMonday = mon;
    }

    // Return in chronological order (oldest first)
    return weeks.reverse();
  }

  /**
   * Generates 6 consecutive calendar month intervals ending at the provided 'until' date.
   */
  private generateLast6Months(untilStr?: string) {
    let endDate = untilStr ? parseISO(untilStr) : new Date();
    if (!isValid(endDate)) endDate = new Date();

    const periods: any[] = [];
    for (let i = 0; i < 6; i++) {
      // Start of month (1st day)
      const sinceDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);

      let untilDate;
      if (i === 0) {
        untilDate = new Date(endDate);
      } else {
        // End of target month (Day 0 of next month)
        untilDate = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0);
      }

      periods.push({
        label: `${format(sinceDate, 'do MMM')} - ${format(untilDate, 'do MMM')}`,
        since: format(sinceDate, 'yyyy-MM-dd'),
        until: format(untilDate, 'yyyy-MM-dd'),
      });
    }
    return periods.reverse();
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  private async apiGet(url: string, params: any) {
    try {
      // Create agents to force IPv4 (family: 4)
      // This often solves "500 Internal Server Error" issues on VPS where IPv6 route is unstable
      const httpsAgent = new https.Agent({ family: 4 });
      const httpAgent = new http.Agent({ family: 4 });

      // Add User-Agent to keep Facebook API happy on hosted environments
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      const response = await axios.get(url, {
        params,
        headers,
        httpsAgent,
        httpAgent,
        timeout: 15000 // 15s timeout
      });
      return response.data;
    } catch (error) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data || error.message;
      const errorCode = error.code || 'NO_CODE';

      // Mask token in logs for security
      const safeParams = { ...params };
      if (safeParams.access_token) safeParams.access_token = '***_MASKED_***';

      console.error(`[Instagram API Error] URL: ${url} | Params: ${JSON.stringify(safeParams)}`);
      console.error(`[Instagram API Error] Status: ${status} | Code: ${errorCode}`);
      console.error(`[Instagram API Error] Payload:`, JSON.stringify(message));

      throw new HttpException(message, status);
    }
  }

  private async paginateEndpoint(url: string, initialParams: any) {
    const items: any[] = [];
    let currentUrl = url;
    let currentParams = initialParams;

    while (currentUrl) {
      const data = await this.apiGet(currentUrl, currentParams);
      items.push(...(data.data || []));
      currentUrl = data.paging?.next;
      currentParams = {}; // next page URL already contains params
    }
    return items;
  }

  // ── FIX 1: Removed maxUntil safeguard — it was cutting off current week
  //           on hosted servers due to UTC timezone mismatch with Sri Lanka (UTC+5:30).
  //           Now simply returns until+1 day, consistent with all other fetchers.
  private apiUntil(untilStr: string) {
    const dt = parseISO(untilStr);
    const tomorrow = addDays(dt, 1);
    return format(tomorrow, 'yyyy-MM-dd');
  }

  private sumTotalValues(data: any[], metricName: string) {
    for (const m of data) {
      if (m.name === metricName) {
        return m.total_value?.value || 0;
      }
    }
    return 0;
  }

  /**
   * Instagram API limits 'period=day' insights to 30 days.
   * This helper splits ranges longer than 30 days into safe chunks.
   */
  private getChunks(since: string, until: string) {
    const sDate = parseISO(since);
    const uDate = parseISO(this.apiUntil(until));
    const totalDays = differenceInDays(uDate, sDate);

    if (totalDays <= 30) {
      return [{ since, until: format(uDate, 'yyyy-MM-dd') }];
    }

    const chunks: { since: string; until: string }[] = [];
    let currentSince = sDate;
    while (currentSince < uDate) {
      let nextUntil = addDays(currentSince, 25);
      if (nextUntil > uDate) nextUntil = uDate;
      chunks.push({
        since: format(currentSince, 'yyyy-MM-dd'),
        until: format(nextUntil, 'yyyy-MM-dd')
      });
      currentSince = nextUntil;
    }
    return chunks;
  }

  // ── INITIALIZATION ────────────────────────────────────────────────────────

  private async getInstagramId(pageId: string, accessToken: string) {
    const url = `${this.baseUrl}/${pageId}`;
    const data = await this.apiGet(url, { fields: 'instagram_business_account', access_token: accessToken });
    const igId = data.instagram_business_account?.id;
    if (!igId) throw new Error('No instagram_business_account attached.');
    return igId;
  }

  private async getPageToken(pageId: string, accessToken: string) {
    const url = `${this.baseUrl}/${pageId}`;
    const data = await this.apiGet(url, { fields: 'access_token', access_token: accessToken });
    const token = data.access_token;
    if (!token) throw new Error('No page access_token returned.');
    return token;
  }

  // ── FETCHERS ──────────────────────────────────────────────────────────────

  // ── FIX 2: Now uses apiUntil(until) instead of raw `until`,
  //           consistent with all other fetchers. Previously raw `until`
  //           was causing posts/reels to return 0 for current week on hosted.
  private async fetchPostsAndReels(igId: string, since: string, until: string, accessToken: string) {
    let posts = 0;
    let reels = 0;
    const storiesNote = "N/A (24h Stories expire; cannot retrieve historical data via API)";
    try {
      const url = `${this.baseUrl}/${igId}/media`;
      const adjustedUntil = this.apiUntil(until);
      const params = {
        fields: 'id,timestamp,media_type,media_product_type',
        since,
        until: adjustedUntil,
        limit: 100,
        access_token: accessToken
      };
      const mediaItems = await this.paginateEndpoint(url, params);
      for (const item of mediaItems) {
        const mProd = item.media_product_type;
        const mType = item.media_type;

        if (mProd === 'REELS') {
          reels++;
        } else if (mProd === 'FEED') {
          posts++;
        } else if (['IMAGE', 'CAROUSEL_ALBUM'].includes(mType)) {
          posts++;
        } else if (mType === 'VIDEO') {
          reels++; // Standalone videos are Reels in modern IG
        }
      }
    } catch (e) {
      posts = 0;
      reels = 0;
    }
    return { posts, reels, storiesNote };
  }

  private async fetchViewsBreakdown(igId: string, since: string, until: string, accessToken: string) {
    let totalViews = 0, organicViews = 0, adsViews = 0;
    try {
      const url = `${this.baseUrl}/${igId}/insights`;
      const chunks = this.getChunks(since, until);

      const results = await Promise.all(
        chunks.map(chunk => this.apiGet(url, {
          metric: 'views',
          metric_type: 'total_value',
          breakdown: 'media_product_type',
          period: 'day',
          since: chunk.since,
          until: chunk.until,
          access_token: accessToken,
        }).catch(() => ({ data: [] })))
      );

      for (const res of results) {
        for (const m of res.data || []) {
          if (m.name === 'views') {
            const tv = m.total_value || {};
            totalViews += tv.value || 0;
            for (const bd of tv.breakdowns || []) {
              for (const result of bd.results || []) {
                const dim = result.dimension_values || [];
                const val = result.value || 0;
                if (dim.includes('AD')) {
                  adsViews += val;
                } else {
                  organicViews += val;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching views breakdown:', e.message);
    }
    return { totalViews, organicViews, adsViews };
  }

  private async fetchReachBreakdown(igId: string, since: string, until: string, accessToken: string) {
    let totalReach = 0, adsReach = 0;
    try {
      const url = `${this.baseUrl}/${igId}/insights`;
      const chunks = this.getChunks(since, until);

      const results = await Promise.all(
        chunks.map(chunk => this.apiGet(url, {
          metric: 'reach',
          metric_type: 'total_value',
          breakdown: 'media_product_type',
          period: 'day',
          since: chunk.since,
          until: chunk.until,
          access_token: accessToken,
        }).catch(() => ({ data: [] })))
      );

      for (const res of results) {
        for (const m of res.data || []) {
          if (m.name === 'reach') {
            const tv = m.total_value || {};
            totalReach += tv.value || 0;
            for (const bd of tv.breakdowns || []) {
              for (const result of bd.results || []) {
                if ((result.dimension_values || []).includes('AD')) {
                  adsReach += result.value || 0;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching reach breakdown:', e.message);
    }
    const organicReach = Math.max(0, totalReach - adsReach);
    return { totalReach, organicReach, adsReach };
  }

  private async fetchInteractions(igId: string, since: string, until: string, accessToken: string) {
    let interactions = 0, likes = 0, comments = 0, shares = 0;
    try {
      const url = `${this.baseUrl}/${igId}/insights`;
      const chunks = this.getChunks(since, until);

      const allResults = await Promise.all(
        chunks.map(chunk => {
          const baseParams = {
            metric_type: 'total_value',
            period: 'day',
            since: chunk.since,
            until: chunk.until,
            access_token: accessToken,
          };
          return Promise.all([
            this.apiGet(url, { ...baseParams, metric: 'total_interactions' }).catch(() => ({ data: [] })),
            this.apiGet(url, { ...baseParams, metric: 'likes' }).catch(() => ({ data: [] })),
            this.apiGet(url, { ...baseParams, metric: 'comments' }).catch(() => ({ data: [] })),
            this.apiGet(url, { ...baseParams, metric: 'shares' }).catch(() => ({ data: [] })),
          ]);
        })
      );

      for (const [resInteractions, resLikes, resComments, resShares] of allResults) {
        interactions += this.sumTotalValues(resInteractions.data || [], 'total_interactions');
        likes += this.sumTotalValues(resLikes.data || [], 'likes');
        comments += this.sumTotalValues(resComments.data || [], 'comments');
        shares += this.sumTotalValues(resShares.data || [], 'shares');
      }
    } catch (e) {
      console.error('Error fetching interactions:', e.message);
    }
    return { interactions, likes, comments, shares };
  }

  private async fetchFollowerMetrics(igId: string, pageToken: string, since: string, until: string, accessToken: string, pageId: string) {
    let newF = 0, unf = 0, tf: any = 'N/A';

    try {
      // Parallelize profile count and daily follower insights
      const [resUser, resInsights] = await Promise.all([
        this.apiGet(`${this.baseUrl}/${igId}`, { fields: 'followers_count', access_token: accessToken }).catch(() => ({})),
        this.apiGet(`${this.baseUrl}/${pageId}/insights`, {
          metric: 'page_daily_follows_unique,page_daily_unfollows_unique',
          period: 'day',
          since,
          until,
          access_token: pageToken,
        }).catch(() => ({ data: [] })),
      ]);

      tf = resUser.followers_count ?? 'N/A';

      for (const m of resInsights.data || []) {
        const sum = (m.values || []).reduce((s, v) => s + (v.value || 0), 0);
        if (m.name === 'page_daily_follows_unique') newF = sum;
        if (m.name === 'page_daily_unfollows_unique') unf = sum;
      }
    } catch (e) { }
    return { newF, unf, tf };
  }

  private async analyseWeek(igId: string, pageToken: string, week: any, accessToken: string, pageId: string) {
    const { since, until, label } = week;

    // Debug log for checking call parameters on hosted
    console.log(`[Instagram Debug] Analysing: ${label} | Since: ${since} | Until: ${until}`);

    // Multi-level parallelization: Fetch all metric categories for a week simultaneously
    const [postsData, views, reach, interactions, followers] = await Promise.all([
      this.fetchPostsAndReels(igId, since, until, accessToken),
      this.fetchViewsBreakdown(igId, since, until, accessToken),
      this.fetchReachBreakdown(igId, since, until, accessToken),
      this.fetchInteractions(igId, since, until, accessToken),
      this.fetchFollowerMetrics(igId, pageToken, since, until, accessToken, pageId),
    ]);

    return {
      week: label,
      since,
      until,
      no_of_posts: postsData.posts,
      no_of_reels: postsData.reels,
      no_of_stories: postsData.storiesNote,
      views: {
        organic: views.organicViews,
        ads: views.adsViews,
        total: views.totalViews,
      },
      reach: {
        organic: reach.organicReach,
        ads: reach.adsReach,
        total: reach.totalReach,
        _note: "Organic = Total - Ads. Organic+Ads may exceed Total due to unique-account deduplication.",
      },
      content_interactions: {
        total: interactions.interactions,
        likes: interactions.likes,
        comments: interactions.comments,
        shares: interactions.shares,
      },
      new_follows: followers.newF,
      unfollows: followers.unf,
      total_followers: followers.tf,
    };
  }
}
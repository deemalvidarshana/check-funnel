import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';

@Injectable()
export class FacebookService {
  private readonly baseUrl = 'https://graph.facebook.com/v25.0';

  async getInsights(dto: { pageId: string; accessToken: string; since: string; until: string }) {
    const { pageId, accessToken, since, until } = dto;
    const adjustedUntil = this.apiUntil(until);
    const auth = { access_token: accessToken };

    const staticPosts = await this.fetchCounts(pageId, auth, since, adjustedUntil);
    const views = await this.fetchViews(pageId, auth, since, adjustedUntil);
    const videoViews = await this.fetch3sViews(pageId, auth, since, adjustedUntil);
    const interactions = await this.fetchInteractions(pageId, auth, since, adjustedUntil);
    const followers = await this.fetchFollowerMetrics(pageId, auth, since, adjustedUntil);

    return {
      since,
      until,
      static_posts: staticPosts.static_posts,
      no_of_stories: "N/A (24h Stories expire; cannot retrieve historical data via API)",
      no_of_reels: staticPosts.reels,
      views: {
        organic: views.organic,
        ads: views.ads,
      },
      three_second_views: {
        organic: videoViews.organic,
        ads: videoViews.ads,
      },
      content_interactions: {
        followers: interactions.followers,
        non_followers: interactions.non_followers,
        interactions_total: interactions.total,
      },
      new_follows: followers.new_follows,
      unfollows: followers.unfollows,
      total_followers: followers.total_followers,
    };
  }

  private async apiGet(url: string, params: any) {
    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data || error.message;
      throw new HttpException(message, status);
    }
  }

  private apiUntil(untilStr: string) {
    // Add 1 day to 'until' because Facebook API's until is exclusive.
    // This aligns the API fetch with the visual label (e.g., getting data for the boundary day).
    try {
      const dt = addDays(parseISO(untilStr), 1);
      return format(dt, 'yyyy-MM-dd');
    } catch (e) {
      return untilStr;
    }
  }

  /**
   * Page Insights API often has a 30-day limit for 'period=day' metrics.
   * This helper splits ranges longer than 30 days into safe chunks.
   */
  private getChunks(since: string, until: string) {
    const sDate = parseISO(since);
    const uDate = parseISO(until);
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

  private async insightsCall(pageId: string, auth: any, metrics: string[], period: string, since: string, until: string, breakdown?: string) {
    const params = {
      ...auth,
      metric: metrics.join(','),
      period,
      since,
      until,
    };
    if (breakdown) params['breakdown'] = breakdown;
    return this.apiGet(`${this.baseUrl}/${pageId}/insights`, params);
  }

  private async *paginateEndpoint(url: string, params: any) {
    let currentUrl = url;
    let currentParams = params;
    while (true) {
      const body = await this.apiGet(currentUrl, currentParams);
      yield* body.data || [];
      const next = body.paging?.next;
      if (!next || !body.data?.length) break;
      currentUrl = next;
      currentParams = {};
    }
  }

  private sumScalar(data: any[], name: string): number {
    const item = data.find((it) => it.name === name);
    if (!item) return 0;
    return item.values.reduce((sum, v) => sum + (typeof v.value === 'number' ? v.value : 0), 0);
  }

  private lastScalar(data: any[], name: string): number {
    const item = data.find((it) => it.name === name);
    if (!item || !item.values.length) return 0;
    const vals = item.values.map((v) => v.value).filter((v) => typeof v === 'number');
    return vals.length ? vals[vals.length - 1] : 0;
  }

  private parseBreakdown(data: any[], metricName: string): { true: number; false: number } {
    const matching = data.filter((it) => it.name === metricName);
    if (!matching.length) return { true: 0, false: 0 };

    let trueTotal = 0;
    let falseTotal = 0;
    let formatDetected = 'none';

    // Format A/C: value is a dict OR is_from_ads/is_from_followers keys are direct
    for (const item of matching) {
      for (const val of item.values || []) {
        const v = val.value;
        if (typeof v === 'object' && v !== null) {
          formatDetected = 'A';
          for (const rawKey of Object.keys(v)) {
            const k = rawKey.toLowerCase().trim();
            if (['true', '1', 'yes'].includes(k)) trueTotal += v[rawKey];
            else if (['false', '0', 'no'].includes(k)) falseTotal += v[rawKey];
          }
        } else if (typeof v === 'number') {
          for (const bKey of ['is_from_ads', 'is_from_followers']) {
            if (val[bKey] !== undefined) {
              formatDetected = 'C';
              const k = String(val[bKey]).toLowerCase().trim();
              if (['true', '1', 'yes'].includes(k)) trueTotal += v;
              else if (['false', '0', 'no'].includes(k)) falseTotal += v;
              break;
            }
          }
        }
      }
    }

    if (formatDetected !== 'none') return { true: trueTotal, false: falseTotal };

    // Format B: multiple items, scalar values, id/title encodes split
    const classified: { sum: number; isTrue: boolean; isFalse: boolean; meta: string }[] = [];
    for (const item of matching) {
      const meta = `${item.id || ''} ${item.title || ''} ${item.description || ''}`.toLowerCase();
      const itemSum = this.sumScalar([item], metricName);
      if (itemSum === 0) continue;

      const isTrue = meta.includes('=true') || meta.includes('/true') || meta.includes('paid') || meta.includes('from ads') || (meta.includes('follower') && !meta.includes('non'));
      const isFalse = meta.includes('=false') || meta.includes('/false') || meta.includes('organic') || meta.includes('non-paid') || meta.includes('non_follower') || meta.includes('non follower');

      classified.push({ sum: itemSum, isTrue, isFalse, meta });
    }

    const clearTrue = classified.filter(c => c.isTrue && !c.isFalse);
    const clearFalse = classified.filter(c => c.isFalse && !c.isTrue);
    const ambiguous = classified.filter(c => !c.isTrue && !c.isFalse);

    if (clearTrue.length || clearFalse.length) {
      return {
        true: clearTrue.reduce((s, c) => s + c.sum, 0),
        false: clearFalse.reduce((s, c) => s + c.sum, 0)
      };
    }

    // Best Guesses (Format B Fallbacks from test.py)
    if (classified.length === 2 && ambiguous.length > 0) {
      // Positional fallback: Organic first, Ads second
      return { true: classified[1].sum, false: classified[0].sum };
    }

    if (classified.length === 1) {
      const c = classified[0];
      if (c.isTrue) return { true: c.sum, false: 0 };
      if (c.isFalse) return { true: 0, false: c.sum };
      return { true: 0, false: c.sum }; // Default to organic
    }

    return { true: 0, false: 0 };
  }

  private async fetchViews(pageId: string, auth: any, since: string, until: string) {
    // chunks are from since to adjustedUntil
    const chunks = this.getChunks(since, until);
    
    // Strategy: Fetch all chunks and sum them up
    const fetchChunk = async (s: string, u: string) => {
        let organic = 0, ads = 0;
        // Primary Attempt
        try {
          const raw = await this.insightsCall(pageId, auth, ['page_media_view'], 'day', s, u, 'is_from_ads');
          const res = this.parseBreakdown(raw.data || [], 'page_media_view');
          if (res.true > 0 || res.false > 0) return { organic: res.false, ads: res.true };
        } catch (e) {}

        // Fallback A
        try {
          const rawTotal = await this.insightsCall(pageId, auth, ['page_media_view'], 'day', s, u);
          const total = this.sumScalar(rawTotal.data || [], 'page_media_view');
          const rawPaid = await this.insightsCall(pageId, auth, ['page_impressions_paid'], 'day', s, u);
          const paid = this.sumScalar(rawPaid.data || [], 'page_impressions_paid');
          if (total > 0) return { organic: Math.max(0, total - paid), ads: paid };
        } catch (e) {}

        // Fallback B
        try {
          const raw = await this.insightsCall(pageId, auth, ['page_posts_impressions_organic_unique', 'page_posts_impressions_paid_unique'], 'day', s, u);
          const d = raw.data || [];
          const organic_b = this.sumScalar(d, 'page_posts_impressions_organic_unique');
          const paid_b = this.sumScalar(d, 'page_posts_impressions_paid_unique');
          if (organic_b > 0 || paid_b > 0) return { organic: organic_b, ads: paid_b };
        } catch (e) {}

        return { organic, ads };
    };

    const results = await Promise.all(chunks.map(c => fetchChunk(c.since, c.until)));
    return results.reduce(
        (acc, r) => ({ organic: acc.organic + r.organic, ads: acc.ads + r.ads }),
        { organic: 0, ads: 0 }
    );
  }

  private async fetchViewsB(pageId: string, auth: any, since: string, until: string) {
    // Fallback B: page_posts_impressions_organic_unique + page_posts_impressions_paid_unique
    try {
      const raw = await this.insightsCall(pageId, auth, ['page_posts_impressions_organic_unique', 'page_posts_impressions_paid_unique'], 'day', since, until);
      const d = raw.data || [];
      const organic = this.sumScalar(d, 'page_posts_impressions_organic_unique');
      const paid = this.sumScalar(d, 'page_posts_impressions_paid_unique');
      if (organic > 0 || paid > 0) return { organic, ads: paid };
    } catch (e) {}
    return { organic: 0, ads: 0 };
  }

  private async fetch3sViews(pageId: string, auth: any, since: string, until: string) {
    const chunks = this.getChunks(since, until);
    const results = await Promise.all(chunks.map(async (c) => {
      try {
        const raw = await this.insightsCall(pageId, auth, ['page_video_views_by_uploaded_hosted', 'page_video_views_organic'], 'day', c.since, c.until);
        const data = raw.data || [];
        const rawOrganic = this.sumScalar(data, 'page_video_views_organic');
        let total = 0;
        const uploadedItem = data.find(it => it.name === 'page_video_views_by_uploaded_hosted');
        if (uploadedItem) {
          uploadedItem.values.forEach(val => {
            if (val.value?.page_uploaded) total += val.value.page_uploaded;
          });
        }
        const organic = Math.min(total, rawOrganic);
        return { organic, ads: Math.max(0, total - organic) };
      } catch (e) {
        return { organic: 0, ads: 0 };
      }
    }));

    return results.reduce(
        (acc, r) => ({ organic: acc.organic + r.organic, ads: acc.ads + r.ads }),
        { organic: 0, ads: 0 }
    );
  }

  private async fetchInteractions(pageId: string, auth: any, since: string, until: string) {
    const chunks = this.getChunks(since, until);
    const results = await Promise.all(chunks.map(async (c) => {
      try {
        const raw = await this.insightsCall(pageId, auth, ['page_post_engagements'], 'day', c.since, c.until);
        return this.sumScalar(raw.data || [], 'page_post_engagements');
      } catch (e) {
        return 0;
      }
    }));

    const total = results.reduce((sum, r) => sum + r, 0);
    return { followers: 'N/A', non_followers: 'N/A', total };
  }

  private async fetchFollowerMetrics(pageId: string, auth: any, since: string, until: string) {
    const chunks = this.getChunks(since, until);
    // For scalar sums (follows/unfollows) we sum all chunks.
    // For last value (total followers), we only take from the last chunk.
    const results = await Promise.all(chunks.map(async (c) => {
      try {
        const metrics = ['page_daily_follows_unique', 'page_daily_unfollows_unique', 'page_follows'];
        const raw = await this.insightsCall(pageId, auth, metrics, 'day', c.since, c.until);
        const data = raw.data || [];
        return {
          new_follows: this.sumScalar(data, 'page_daily_follows_unique'),
          unfollows: this.sumScalar(data, 'page_daily_unfollows_unique'),
          total_followers: this.lastScalar(data, 'page_follows'),
        };
      } catch (e) {
        return { new_follows: 0, unfollows: 0, total_followers: 0 };
      }
    }));

    return {
      new_follows: results.reduce((s, r) => s + r.new_follows, 0),
      unfollows: results.reduce((s, r) => s + r.unfollows, 0),
      total_followers: results.length ? results[results.length - 1].total_followers : 0,
    };
  }

  private async fetchCounts(pageId: string, auth: any, since: string, until: string) {
    // Chunking for counts is also useful to avoid timeout on very busy pages
    const chunks = this.getChunks(since, until);
    const results = await Promise.all(chunks.map(async (c) => {
      let staticPosts = 0;
      let reels = 0;

      try {
        const feedUrl = `${this.baseUrl}/${pageId}/feed`;
        const feedParams = { ...auth, fields: 'attachments{media_type,type}', since: c.since, until: c.until, limit: 100 };
        for await (const item of this.paginateEndpoint(feedUrl, feedParams) as any) {
          const atts = item.attachments?.data || [];
          const isVideo = atts.some(a => (a.media_type || '').includes('video'));
          const isReel = atts.some(a => (a.type || '').includes('reel'));
          if (!isVideo && !isReel) staticPosts++;
        }
      } catch (e) {}

      try {
        const reelsUrl = `${this.baseUrl}/${pageId}/video_reels`;
        const reelsParams = { ...auth, fields: 'id', since: c.since, until: c.until, limit: 100 };
        for await (const _ of this.paginateEndpoint(reelsUrl, reelsParams) as any) {
          reels++;
        }
      } catch (e) {}

      return { staticPosts, reels };
    }));

    return {
      static_posts: results.reduce((s, r) => s + r.staticPosts, 0),
      reels: results.reduce((s, r) => s + r.reels, 0),
    };
  }
}

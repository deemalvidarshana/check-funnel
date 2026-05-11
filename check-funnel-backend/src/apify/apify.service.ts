import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApifyPost } from './entities/apify-post.entity';
import { ApifyTrackedAccount } from './entities/apify-tracked-account.entity';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import axios from 'axios';

@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name);

  constructor(
    @InjectRepository(ApifyPost)
    private apifyPostRepo: Repository<ApifyPost>,
    @InjectRepository(ApifyTrackedAccount)
    private apifyTrackedAccountRepo: Repository<ApifyTrackedAccount>,
    private settingsService: SystemSettingsService,
  ) {}

  private formatRangeLabel(newerThan?: string, olderThan?: string): string {
    if (!newerThan && !olderThan) return 'All Time Sync';
    
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    };

    if (newerThan && olderThan) {
      return `${formatDate(newerThan)} - ${formatDate(olderThan)}`;
    } else if (newerThan) {
      return `From ${formatDate(newerThan)}`;
    } else if (olderThan) {
      return `Until ${formatDate(olderThan)}`;
    }
    return 'All Time Sync';
  }

  async fetchAndSave(clientId: number, config: any) {
    const settings = await this.settingsService.getSettings();
    const apiKey = settings.apifyApiKey;

    if (!apiKey) {
      throw new BadRequestException('Apify API Key is not configured in System Settings.');
    }

    this.logger.log(`Starting Apify fetch for Client ${clientId}`);

    try {
      const platform = (config.platform || 'facebook').toLowerCase();
      this.logger.log(`Received fetch request for platform: ${platform}, clientId: ${clientId}`);
      
      let postsActor = 'apify~facebook-posts-scraper';
      let postsConfig: any = {};
      let pageActor = 'apify~facebook-pages-scraper';
      let pageConfig: any = {};
      let hasPageScraper = (platform === 'facebook');

      if (platform === 'tiktok') {
        postsActor = 'clockworks~tiktok-profile-scraper';
        postsConfig = {
          profiles: config.urls,
          resultsPerPage: config.resultsAmount || 100,
          newestPostDate: config.olderThan || undefined,
          oldestPostDateUnified: config.newerThan || undefined,
          shouldDownloadAvatars: true,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          shouldDownloadSlideshowImages: false
        };
      } else if (platform === 'instagram') {
        postsActor = 'apify~instagram-post-scraper';
        postsConfig = {
          username: config.urls,
          resultsLimit: config.resultsAmount || 100,
          onlyPostsNewerThan: config.newerThan || undefined,
          // Instagram scraper often doesn't have a direct "older than" filter in the same way,
          // so we rely on newerThan and resultsLimit.
        };
        pageActor = 'apify~instagram-profile-scraper';
        pageConfig = {
          usernames: config.urls,
          includeAboutSection: false
        };
        hasPageScraper = true;
      } else {
        postsConfig = {
          startUrls: config.urls.map((u: string) => ({ url: u })),
          resultsLimit: config.resultsAmount || 100,
          onlyPostsNewerThan: config.newerThan || undefined,
          onlyPostsOlderThan: config.olderThan || undefined,
        };
        pageConfig = {
          startUrls: config.urls.map((u: string) => ({ url: u })),
        };
      }

      this.logger.log(`Starting Apify actor: ${postsActor}`);

      // 1. Helper function to run actor and wait for it
      const runAndWait = async (actor: string, input: any) => {
        // Start the run
        const runRes = await axios.post(
          `https://api.apify.com/v2/acts/${actor}/runs?token=${apiKey}`,
          input
        );
        const runId = runRes.data.data.id;
        const defaultDatasetId = runRes.data.data.defaultDatasetId;
        
        this.logger.log(`Actor ${actor} started. Run ID: ${runId}`);

        // Poll for completion (max 10 minutes)
        const startTime = Date.now();
        while (Date.now() - startTime < 600000) {
          const statusRes = await axios.get(
            `https://api.apify.com/v2/acts/${actor}/runs/${runId}?token=${apiKey}`
          );
          const status = statusRes.data.data.status;
          
          if (status === 'SUCCEEDED') {
            this.logger.log(`Actor ${actor} succeeded.`);
            // Fetch dataset items
            const itemsRes = await axios.get(
              `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${apiKey}`
            );
            return itemsRes.data;
          } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
            throw new Error(`Apify actor ${actor} ${status.toLowerCase()}`);
          }
          
          // Wait 5 seconds before polling again
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        throw new Error(`Apify actor ${actor} timed out after 10 minutes`);
      };

      // 2. Run both actors (if needed)
      const postsPromise = runAndWait(postsActor, postsConfig);
      const pagePromise = hasPageScraper ? runAndWait(pageActor, pageConfig) : Promise.resolve([]);

      const [items, pageItems] = await Promise.all([postsPromise, pagePromise]);

      if (!Array.isArray(items)) {
        throw new Error(`Unexpected response format from Apify ${platform} Scraper`);
      }

      const syncRangeLabel = this.formatRangeLabel(config.newerThan, config.olderThan);
      this.logger.log(`Received ${items.length} items for ${platform}. Using sync range label: ${syncRangeLabel}`);

      // Create a map of page stats for easy lookup
      const pageStatsMap = new Map();
      if (Array.isArray(pageItems)) {
        for (const p of pageItems) {
          const url = p.url || p.pageUrl || p.inputUrl;
          if (url) {
            // Instagram profile scraper uses followersCount, FB uses likes
            const count = p.followersCount || p.likes || 0;
            pageStatsMap.set(url.replace(/\/$/, '').toLowerCase(), count);
          }
        }
      }

      let inserted = 0;
      let updatedAccounts = 0;

      for (const item of items) {
        if (item.error) continue;

        // 2. Map/Update Tracked Account
        let rawProfileUrl: string;
        let username: string;
        let displayName: string;
        let profilePicUrl: string;
        let followerCount = 0;

        if (platform === 'tiktok') {
          username = item['authorMeta.name'] || item.authorMeta?.name || 'Unknown';
          rawProfileUrl = `https://www.tiktok.com/@${username}`;
          displayName = item['authorMeta.nickName'] || item.authorMeta?.nickName || username;
          profilePicUrl = item['authorMeta.avatar'] || item.authorMeta?.avatar || null;
          followerCount = Number(item['authorMeta.fans'] || item.authorMeta?.fans || 0);
        } else if (platform === 'instagram') {
          username = item.ownerUsername || 'Unknown';
          rawProfileUrl = item.inputUrl || `https://www.instagram.com/${username}`;
          displayName = item.ownerFullName || username;
          profilePicUrl = item.ownerProfilePicUrl || null;
          
          const normalizedUrl = rawProfileUrl ? rawProfileUrl.replace(/\/$/, '').toLowerCase() : null;
          followerCount = pageStatsMap.get(normalizedUrl) || 0;
        } else {
          rawProfileUrl = item.facebookUrl || item.instagramUrl || item.inputUrl;
          username = item.pageName || (item.user && item.user.name) || (item.ownerUsername) || 'Unknown';
          displayName = item.user ? item.user.name : (item.pageName || item.ownerFullName || 'Unknown');
          profilePicUrl = item.user ? item.user.profilePic : (item.ownerProfilePicUrl || null);
          
          const normalizedUrl = rawProfileUrl ? rawProfileUrl.replace(/\/$/, '').toLowerCase() : null;
          followerCount = pageStatsMap.get(normalizedUrl) || 0;
        }

        const profileUrl = rawProfileUrl ? rawProfileUrl.replace(/\/$/, '').toLowerCase() : null;
        if (!profileUrl) continue;

        let account = await this.apifyTrackedAccountRepo.findOne({
          where: { clientId, platform, url: profileUrl }
        });

        if (!account) {
          account = this.apifyTrackedAccountRepo.create({
            clientId,
            platform,
            url: profileUrl,
            username,
            displayName,
            profilePicUrl,
            followerCount
          });
          account = await this.apifyTrackedAccountRepo.save(account);
          updatedAccounts++;
        } else {
          let changed = false;
          if (followerCount > 0 && account.followerCount !== followerCount) {
            account.followerCount = followerCount;
            changed = true;
          }
          if (displayName && account.displayName !== displayName) {
            account.displayName = displayName;
            changed = true;
          }
          if (profilePicUrl && account.profilePicUrl !== profilePicUrl) {
            account.profilePicUrl = profilePicUrl;
            changed = true;
          }
          if (changed) {
            await this.apifyTrackedAccountRepo.save(account);
          }
        }

        // 3. Save or Update Post
        const postId = (platform === 'tiktok' || platform === 'instagram') ? (item.id || item.postId) : (item.postId || item.id);
        if (!postId) continue;

        // Custom filtering for Instagram "Older Than" (as actor doesn't support it natively)
        const postDate = item.timestamp || item.createdAt || item.date;
        if (platform === 'instagram' && config.olderThan && postDate) {
          if (new Date(postDate) > new Date(config.olderThan)) {
            continue; // Skip posts that are newer than the olderThan threshold
          }
        }

        let post = await this.apifyPostRepo.findOne({
          where: { clientId, platform, postId }
        });

        const reactions = (platform === 'tiktok' || platform === 'instagram') ? {
          love: 0, care: 0, wow: 0, haha: 0, sad: 0, angry: 0
        } : {
          love: item.reactionLoveCount || 0,
          care: item.reactionCareCount || 0,
          wow: item.reactionWowCount || 0,
          haha: item.reactionHahaCount || 0,
          sad: item.reactionSadCount || 0,
          angry: item.reactionAngryCount || 0,
        };

        let likes = 0;
        if (platform === 'tiktok') {
          likes = Number(item.diggCount) || 0;
        } else if (platform === 'instagram') {
          likes = Number(item.likesCount) || 0;
        } else {
          likes = item.likes || item.likesCount || item.reactionLikeCount || 0;
        }
          
        let views = 0;
        if (platform === 'tiktok') {
          views = Number(item.playCount) || 0;
        } else if (platform === 'instagram') {
          views = Number(item.videoPlayCount || item.videoViewCount || 0);
        } else {
          views = item.viewsCount || item.videoPlayCount || 0;
        }
          
        let comments = 0;
        if (platform === 'tiktok') {
          comments = Number(item.commentCount) || 0;
        } else if (platform === 'instagram') {
          comments = Number(item.commentsCount) || 0;
        } else {
          comments = item.comments || item.commentsCount || 0;
        }
          
        let shares = 0;
        if (platform === 'tiktok') {
          shares = Number(item.shareCount) || 0;
        } else if (platform === 'instagram') {
          shares = 0; // Scraper doesn't usually provide shares
        } else {
          shares = item.shares || item.sharesCount || 0;
        }
          
        const caption = item.text || item.caption || '';
        const postUrl = (platform === 'tiktok' || platform === 'instagram') ? (item.webVideoUrl || item.url) : (item.url || item.postUrl);
        const createdAtStr = (platform === 'tiktok' || platform === 'instagram') ? (item.createTimeISO || item.timestamp) : (item.time || item.timestamp);

        if (post) {
          post.views = views;
          post.likes = likes;
          post.commentsCount = comments;
          post.shares = shares;
          post.reactions = reactions;
          post.caption = caption;
          post.rawData = item;
          post.syncRangeLabel = syncRangeLabel;
          await this.apifyPostRepo.save(post);
          inserted++;
        } else {
          post = this.apifyPostRepo.create({
            clientId,
            apifyTrackedAccountId: account.id,
            platform,
            postId,
            postUrl,
            createdAt: createdAtStr ? new Date(createdAtStr) : new Date(),
            views,
            likes,
            commentsCount: comments,
            shares,
            caption,
            media: item.media || (item.videoUrl ? [{ type: 'video', url: item.videoUrl }] : (item.displayUrl ? [{ type: 'image', url: item.displayUrl }] : (item.videoMeta?.coverUrl ? [{ type: 'video', url: item.videoMeta.coverUrl }] : []))),
            reactions,
            rawData: item,
            syncRangeLabel
          });
          await this.apifyPostRepo.save(post);
          inserted++;
        }
      }

      return {
        success: true,
        totalItems: items.length,
        insertedPosts: inserted,
        newAccounts: updatedAccounts
      };

    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      this.logger.error(`Apify fetch failed: ${msg}`);
      throw new BadRequestException(`Apify fetch failed: ${msg}`);
    }
  }

  async getPosts(clientId: number, platform?: string) {
    const query = this.apifyPostRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.trackedAccount', 'ta')
      .where('post.clientId = :clientId', { clientId });

    if (platform) {
      query.andWhere('post.platform = :platform', { platform });
    }

    return query.orderBy('post.createdAt', 'DESC').getMany();
  }

  async getSummary(clientId: number, platform?: string) {
    const qb = this.apifyPostRepo
      .createQueryBuilder('post')
      .leftJoin('post.trackedAccount', 'ta')
      .select('ta.username', 'username')
      .addSelect('ta.displayName', 'displayName')
      .addSelect('ta.followerCount', 'followerCount')
      .addSelect('COUNT(*)', 'totalPosts')
      .addSelect('SUM(post.views)', 'totalViews')
      .addSelect('SUM(post.likes)', 'totalLikes')
      .addSelect('SUM(post.commentsCount)', 'totalComments')
      .addSelect('SUM(post.shares)', 'totalShares')
      .addSelect('AVG(post.views)', 'avgViews')
      .addSelect('AVG(post.likes)', 'avgLikes')
      .where('post.clientId = :clientId', { clientId });

    if (platform) {
      qb.andWhere('post.platform = :platform', { platform });
    }

    qb.groupBy('ta.id');
    return qb.getRawMany();
  }

  async getPostById(id: number) {
    const post = await this.apifyPostRepo.findOne({
      where: { id },
      relations: ['trackedAccount'],
    });
    if (!post) throw new BadRequestException('Apify post not found');
    return post;
  }
}

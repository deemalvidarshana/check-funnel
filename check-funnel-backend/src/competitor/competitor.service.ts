import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackedAccount } from './entities/tracked-account.entity';
import { SocialMediaPost } from './entities/social-media-post.entity';
import {
  NormalizedPost,
  normalizeTikTokRow,
  normalizeInstagramRow,
  normalizeFacebookRow,
} from './adapters/platform-adapters';
import * as csv from 'csv-parse/sync';

@Injectable()
export class CompetitorService {
  constructor(
    @InjectRepository(TrackedAccount)
    private trackedAccountRepo: Repository<TrackedAccount>,

    @InjectRepository(SocialMediaPost)
    private socialMediaPostRepo: Repository<SocialMediaPost>,
  ) {}

  // ==================== Tracked Accounts ====================

  async createTrackedAccount(data: Partial<TrackedAccount>): Promise<TrackedAccount> {
    const existing = await this.trackedAccountRepo.findOne({
      where: { platform: data.platform, username: data.username },
    });
    if (existing) {
      throw new BadRequestException(`Account ${data.username} on ${data.platform} is already tracked.`);
    }
    const account = this.trackedAccountRepo.create(data);
    return this.trackedAccountRepo.save(account);
  }

  async getTrackedAccounts(clientId?: number): Promise<TrackedAccount[]> {
    const where: any = {};
    if (clientId) where.clientId = clientId;
    return this.trackedAccountRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async deleteTrackedAccount(id: number): Promise<void> {
    const result = await this.trackedAccountRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Tracked account not found');
  }

  // ==================== CSV Upload ====================

  async uploadCSV(
    fileBuffer: Buffer,
    platform: string,
    clientId: number,
  ): Promise<{ inserted: number; skipped: number; autoCreated: string[] }> {
    // Parse CSV
    const records = csv.parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      relaxColumnCount: true,
      trim: true,
      bom: true,
    });

    console.log(`[CSV Upload] Platform: ${platform}, Total CSV rows: ${records.length}`);
    if (records.length > 0) {
      console.log(`[CSV Upload] First row keys:`, Object.keys(records[0] as any));
      console.log(`[CSV Upload] First row sample:`, JSON.stringify(records[0]).substring(0, 300));
    }

    // Get all tracked accounts for this client
    const trackedAccounts = await this.trackedAccountRepo.find({
      where: { clientId },
    });

    // Build a lookup map: username (lowercase) → tracked account
    const accountMap = new Map<string, TrackedAccount>();
    for (const acc of trackedAccounts) {
      if (acc.platform === platform) {
        accountMap.set(acc.username.toLowerCase(), acc);
      }
    }

    let inserted = 0;
    let skipped = 0;
    const autoCreatedSet = new Set<string>();

    for (const row of records) {
      let normalized: NormalizedPost | null = null;

      if (platform === 'tiktok') {
        normalized = normalizeTikTokRow(row as Record<string, any>);
      } else if (platform === 'instagram') {
        normalized = normalizeInstagramRow(row as Record<string, any>);
      } else if (platform === 'facebook') {
        normalized = normalizeFacebookRow(row as Record<string, any>);
      }

      if (!normalized || !normalized.username) {
        console.log(`[CSV Upload] SKIP: empty username. Row keys:`, Object.keys(row as any));
        skipped++;
        continue;
      }

      // Look up the tracked account, auto-create if not found
      let trackedAccount = accountMap.get(normalized.username.toLowerCase());
      if (!trackedAccount) {
        // Auto-register this username as a competitor tracked account
        const newAccount = this.trackedAccountRepo.create({
          clientId,
          platform,
          username: normalized.username,
          displayName: normalized.username,
          accountType: 'competitor',
          followerCount: normalized.followers || 0,
        });
        trackedAccount = await this.trackedAccountRepo.save(newAccount);
        accountMap.set(normalized.username.toLowerCase(), trackedAccount);
        autoCreatedSet.add(normalized.username);
      } else if (normalized.followers && normalized.followers > 0 && trackedAccount.followerCount < normalized.followers) {
        // Update follower count to the max observed
        trackedAccount.followerCount = normalized.followers;
        trackedAccount = await this.trackedAccountRepo.save(trackedAccount);
        accountMap.set(normalized.username.toLowerCase(), trackedAccount);
      }

      // Check for duplicate post
      if (normalized.postId) {
        const existing = await this.socialMediaPostRepo.findOne({
          where: { platform, postId: normalized.postId },
        });
        if (existing) {
          if (inserted === 0 && skipped < 3) {
            console.log(`[CSV Upload] DUPLICATE: postId=${normalized.postId}, user=${normalized.username}`);
          }
          skipped++;
          continue;
        }
      }

      // Insert the post
      const post = this.socialMediaPostRepo.create({
        clientId,
        trackedAccountId: trackedAccount.id,
        platform,
        accountType: trackedAccount.accountType,
        postId: normalized.postId,
        postUrl: normalized.postUrl,
        createdAt: normalized.createdAt ? new Date(normalized.createdAt) : undefined,
        views: normalized.views,
        likes: normalized.likes,
        commentsCount: normalized.commentsCount,
        shares: normalized.shares,
        rawExtensionData: normalized.rawData,
      } as any);

      await this.socialMediaPostRepo.save(post);
      inserted++;
    }

    return { inserted, skipped, autoCreated: Array.from(autoCreatedSet) };
  }

  // ==================== Data Retrieval ====================

  async getPostsForClient(
    clientId: number,
    platform?: string,
    from?: string,
    to?: string,
  ): Promise<SocialMediaPost[]> {
    const qb = this.socialMediaPostRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.trackedAccount', 'ta')
      .where('post.clientId = :clientId', { clientId });

    if (platform) {
      qb.andWhere('post.platform = :platform', { platform });
    }
    if (from) {
      qb.andWhere('post.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('post.createdAt <= :to', { to });
    }

    qb.orderBy('post.createdAt', 'DESC');
    return qb.getMany();
  }

  async getSummaryForClient(clientId: number, platform?: string) {
    const qb = this.socialMediaPostRepo
      .createQueryBuilder('post')
      .leftJoin('post.trackedAccount', 'ta')
      .select('ta.username', 'username')
      .addSelect('ta.displayName', 'displayName')
      .addSelect('ta.accountType', 'accountType')
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

  async getPostById(id: number): Promise<SocialMediaPost> {
    const post = await this.socialMediaPostRepo.findOne({
      where: { id },
      relations: ['trackedAccount'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}

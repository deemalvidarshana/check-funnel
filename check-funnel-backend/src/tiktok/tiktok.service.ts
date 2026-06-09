import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { randomBytes } from 'crypto';

type TiktokCursor = string | number;

type TiktokVideo = {
  id?: string;
  title?: string;
  create_time?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  cover_image_url?: string;
};

type TiktokVideoListResponse = {
  data?: {
    videos?: TiktokVideo[];
    has_more?: boolean;
    cursor?: TiktokCursor;
  };
};

@Injectable()
export class TiktokService {
  private readonly baseUrl = 'https://open.tiktokapis.com/v2';
  private readonly redirectUri = 'https://deemalvidarshana.github.io/deemal';
  private readonly maxVideoListPages = 12;
  private readonly requestTimeoutMs = 15000;

  // Temporary store for client credentials during OAuth flow
  private pendingAuths = new Map<string, { key: string; secret: string }>();

  getAuthUrl(clientKey: string, clientSecret: string) {
    const state = randomBytes(8).toString('hex');
    this.pendingAuths.set(state, { key: clientKey, secret: clientSecret });

    const scopeList = [
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
    ];
    const scope = scopeList.join(',');

    return `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}`;
  }

  async getAccessTokenByState(code: string, state: string) {
    const credentials = this.pendingAuths.get(state);
    if (!credentials) {
      throw new BadRequestException('Invalid or expired state');
    }

    // Cleanup
    this.pendingAuths.delete(state);

    return this.getAccessToken(code, credentials.key, credentials.secret);
  }

  async getAccessToken(code: string, clientKey: string, clientSecret: string) {
    const url = `${this.baseUrl}/oauth/token/`;
    const payload = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: this.requestTimeoutMs,
      });
      return response.data;
    } catch (error) {
      console.error(
        'TikTok Token Error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to exchange code for token');
    }
  }

  async refreshAccessToken(
    refreshToken: string,
    clientKey: string,
    clientSecret: string,
  ) {
    const url = `${this.baseUrl}/oauth/token/`;
    const payload = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: this.requestTimeoutMs,
      });
      return response.data;
    } catch (error) {
      console.error(
        'TikTok Refresh Error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to refresh access token');
    }
  }

  async getUserInfo(accessToken: string) {
    const url = `${this.baseUrl}/user/info/`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          fields:
            'display_name,follower_count,following_count,likes_count,video_count',
        },
        timeout: this.requestTimeoutMs,
      });
      return response.data;
    } catch (error) {
      console.error(
        'TikTok User Info Error:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  async getVideos(
    accessToken: string,
    cursor?: TiktokCursor,
  ): Promise<TiktokVideoListResponse> {
    const url = `${this.baseUrl}/video/list/`;
    const payload: { max_count: number; cursor?: TiktokCursor } = {
      max_count: 20,
    };
    if (cursor !== undefined && cursor !== null) {
      payload.cursor = cursor;
    }

    try {
      const response = await axios.post<TiktokVideoListResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          fields:
            'id,title,create_time,view_count,like_count,comment_count,share_count,cover_image_url',
        },
        timeout: this.requestTimeoutMs,
      });
      return response.data;
    } catch (error) {
      console.error(
        'TikTok Video List Error:',
        error.response?.data || error.message,
      );
      return { data: { videos: [], has_more: false } };
    }
  }

  async getVideosSince(
    accessToken: string,
    sinceTimestamp: number,
  ): Promise<TiktokVideo[]> {
    const videos: TiktokVideo[] = [];
    let cursor: TiktokCursor | undefined;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < this.maxVideoListPages) {
      const page = await this.getVideos(accessToken, cursor);
      const pageVideos = page.data?.videos || [];

      videos.push(...pageVideos);

      pageCount += 1;
      hasMore = Boolean(page.data?.has_more);
      cursor = page.data?.cursor;

      if (!pageVideos.length || cursor === undefined || cursor === null) break;
      if (
        pageVideos.every((video) => (video.create_time || 0) < sinceTimestamp)
      ) {
        break;
      }
    }

    return videos;
  }

  private getSixMonthStartTimestamp() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    return Math.floor(start.getTime() / 1000);
  }

  async getInsights(client: any) {
    let accessToken = client.tiktokApiKey;

    let userInfo = await this.getUserInfo(accessToken);

    if (!userInfo && client.tiktokRefreshToken) {
      console.log('--- TikTok Token Expired, Refreshing... ---');
      try {
        const refreshData = await this.refreshAccessToken(
          client.tiktokRefreshToken,
          client.tiktokClientKey,
          client.tiktokClientSecret,
        );
        accessToken = refreshData.access_token;
      } catch (e) {
        console.error('Refresh Failed:', e.message);
        throw new BadRequestException(
          'TikTok session expired. Please reconnect your account.',
        );
      }

      userInfo = await this.getUserInfo(accessToken);
    }

    if (!userInfo) {
      throw new BadRequestException('Could not fetch TikTok user data.');
    }

    const videos = await this.getVideosSince(
      accessToken,
      this.getSixMonthStartTimestamp(),
    );

    return {
      user: userInfo.data?.user,
      videos,
      newAccessToken: accessToken !== client.tiktokApiKey ? accessToken : null,
    };
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { randomBytes } from 'crypto';

@Injectable()
export class TiktokService {
  private readonly baseUrl = 'https://open.tiktokapis.com/v2';
  private readonly redirectUri = 'https://deemalvidarshana.github.io/deemal';



  
  // Temporary store for client credentials during OAuth flow
  private pendingAuths = new Map<string, { key: string, secret: string }>();

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
      });
      return response.data;
    } catch (error) {
      console.error('TikTok Token Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to exchange code for token');
    }
  }

  async refreshAccessToken(refreshToken: string, clientKey: string, clientSecret: string) {
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
      });
      return response.data;
    } catch (error) {
      console.error('TikTok Refresh Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to refresh access token');
    }
  }

  async getUserInfo(accessToken: string) {
    const url = `${this.baseUrl}/user/info/`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { fields: 'display_name,follower_count,following_count,likes_count,video_count' },
      });
      return response.data;
    } catch (error) {
      console.error('TikTok User Info Error:', error.response?.data || error.message);
      return null;
    }
  }

  async getVideos(accessToken: string, cursor?: string) {
    const url = `${this.baseUrl}/video/list/`;
    try {
      const response = await axios.post(url, 
        { max_count: 20, cursor }, 
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: { fields: 'id,title,create_time,view_count,like_count,comment_count,share_count,cover_image_url' },
        }
      );
      return response.data;
    } catch (error) {
      console.error('TikTok Video List Error:', error.response?.data || error.message);
      return { data: { videos: [], has_more: false } };
    }
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
          client.tiktokClientSecret
        );
        accessToken = refreshData.access_token;
      } catch (e) {
        console.error('Refresh Failed:', e.message);
        throw new BadRequestException('TikTok session expired. Please reconnect your account.');
      }
      
      userInfo = await this.getUserInfo(accessToken);
    }

    if (!userInfo) {
      throw new BadRequestException('Could not fetch TikTok user data.');
    }

    const videoData = await this.getVideos(accessToken);
    
    return {
      user: userInfo.data?.user,
      videos: videoData.data?.videos || [],
      newAccessToken: accessToken !== client.tiktokApiKey ? accessToken : null
    };
  }
}


import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompetitorService } from './competitor.service';

@Controller('competitors')
export class CompetitorController {
  constructor(private readonly competitorService: CompetitorService) {}

  // ==================== Tracked Accounts ====================

  @Post('tracked-accounts')
  createTrackedAccount(
    @Body()
    body: {
      clientId: number;
      platform: string;
      username: string;
      displayName?: string;
      accountType: string;
      profilePicUrl?: string;
    },
  ) {
    return this.competitorService.createTrackedAccount(body);
  }

  @Get('tracked-accounts')
  getTrackedAccounts(@Query('clientId') clientId?: string) {
    return this.competitorService.getTrackedAccounts(
      clientId ? parseInt(clientId) : undefined,
    );
  }

  @Delete('tracked-accounts/:id')
  deleteTrackedAccount(@Param('id', ParseIntPipe) id: number) {
    return this.competitorService.deleteTrackedAccount(id);
  }

  // ==================== CSV Upload ====================

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(
    @UploadedFile() file: Express.Multer.File,
    @Body('platform') platform: string,
    @Body('clientId') clientId: string,
    @Body('syncRangeLabel') syncRangeLabel?: string,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    return this.competitorService.uploadCSV(
      file.buffer,
      platform,
      parseInt(clientId),
      syncRangeLabel,
    );
  }

  // ==================== Thumbnail Proxy ====================

  @Get('thumbnail')
  async getThumbnail(@Query('url') url: string) {
    if (!url) return { thumbnail: '' };

    try {
      const getPreviewFallback = async () => {
        try {
          const previewUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true`;
          const response = await fetch(previewUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (!response.ok) return '';

          const data = await response.json();
          return (
            data?.data?.image?.url ||
            data?.data?.screenshot?.url ||
            data?.data?.logo?.url ||
            ''
          );
        } catch {
          return '';
        }
      };

      // TikTok oEmbed API (public, no auth needed)
      if (url.includes('tiktok.com')) {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
          const data = await response.json();
          const thumbnail = data.thumbnail_url || '';
          if (thumbnail) return { thumbnail };
        }
      }

      // Instagram media redirect trick (works for many public posts)
      if (url.includes('instagram.com')) {
        // Normalize reel/tv to p for the media redirect to be more reliable
        const normalizedUrl = url.replace(/\/reel\//, '/p/').replace(/\/tv\//, '/p/');
        const baseUrl = normalizedUrl.split('?')[0].replace(/\/$/, '');
        const mediaUrl = `${baseUrl}/media/?size=l`;
        
        // We just return this URL; the proxy-image endpoint will handle the actual fetching/redirects
        return { thumbnail: mediaUrl };
      }

      // Facebook og:image extraction
      if (url.includes('facebook.com')) {
        // Sanitize URL
        const cleanUrl = url.split('&fbclid=')[0].split('?fbclid=')[0];

        const fetchImage = async (ua: string) => {
          const response = await fetch(cleanUrl, {
            headers: { 'User-Agent': ua },
          });
          if (response.ok) {
            const html = await response.text();
            // Try og:image
            const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
            if (ogMatch) return ogMatch[1].replace(/&amp;/g, '&');
            
            // Try video poster (Reels)
            const videoMatch = html.match(/"thumbnailUrl":"([^"]+)"/);
            if (videoMatch) return videoMatch[1].replace(/\\/g, '');
          }
          return null;
        };

        let thumb = await fetchImage('facebookexternalhit/1.1');
        if (!thumb) {
          thumb = await fetchImage('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
        }
        
        if (thumb) return { thumbnail: thumb };
      }

      return { thumbnail: await getPreviewFallback() };
    } catch {
      return { thumbnail: '' };
    }
  }

  @Get('proxy-image')
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    if (!url) return res.status(400).send('No URL provided');
    try {
      const isInstagram = url.includes('instagram.com') || url.includes('cdninstagram.com');
      const isFacebook = url.includes('facebook.com') || url.includes('fbcdn.net');
      
      let referer = 'https://www.tiktok.com/';
      if (isInstagram) referer = 'https://www.instagram.com/';
      if (isFacebook) referer = 'https://www.facebook.com/';

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': referer,
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return res.status(response.status).send('Failed to fetch image');
      }

      res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (e) {
      res.status(500).send('Error proxying image');
    }
  }

  // ==================== Data Retrieval ====================

  @Get(':clientId/posts')
  getPosts(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query('platform') platform?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.competitorService.getPostsForClient(clientId, platform, from, to);
  }

  @Get(':clientId/summary')
  getSummary(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query('platform') platform?: string,
  ) {
    return this.competitorService.getSummaryForClient(clientId, platform);
  }

  @Get('post/:id')
  getPostById(@Param('id', ParseIntPipe) id: number) {
    return this.competitorService.getPostById(id);
  }
}

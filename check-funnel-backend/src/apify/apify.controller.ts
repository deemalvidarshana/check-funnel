import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApifyService } from './apify.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('apify')
@UseGuards(AuthGuard('jwt'))
export class ApifyController {
  constructor(private readonly apifyService: ApifyService) {}

  @Post('fetch/:clientId')
  async fetch(@Param('clientId') clientId: string, @Body() config: any) {
    return this.apifyService.fetchAndSave(Number(clientId), config);
  }

  @Get(':clientId/posts')
  async getPosts(@Param('clientId') clientId: string, @Query('platform') platform?: string) {
    return this.apifyService.getPosts(Number(clientId), platform);
  }

  @Get(':clientId/summary')
  async getSummary(@Param('clientId') clientId: string, @Query('platform') platform?: string) {
    return this.apifyService.getSummary(Number(clientId), platform);
  }

  @Get('post/:id')
  async getPostById(@Param('id') id: string) {
    return this.apifyService.getPostById(Number(id));
  }
}

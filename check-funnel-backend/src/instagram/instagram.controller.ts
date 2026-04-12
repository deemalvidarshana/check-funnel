import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetIgInsightsDto } from './dto/get-ig-insights.dto';

@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Post('insights')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'viewer')
  async getInsights(@Body() getIgInsightsDto: GetIgInsightsDto) {
    return this.instagramService.getWeeklyInsights(getIgInsightsDto);
  }
}

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FacebookService } from './facebook.service';
import { GetFbInsightsDto } from './dto/get-fb-insights.dto';

@Controller('facebook')
@UseGuards(AuthGuard('jwt'))
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Post('fb-insights')
  async getInsights(@Body() getFbInsightsDto: GetFbInsightsDto) {
    return this.facebookService.getInsights(getFbInsightsDto);
  }
}

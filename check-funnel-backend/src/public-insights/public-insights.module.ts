import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicInsightsController } from './public-insights.controller';
import { ClientModule } from '../client/client.module';
import { FacebookModule } from '../facebook/facebook.module';
import { InstagramModule } from '../instagram/instagram.module';
import { TiktokModule } from '../tiktok/tiktok.module';
import { CompetitorModule } from '../competitor/competitor.module';
import { ApifyModule } from '../apify/apify.module';

@Module({
  imports: [
    ClientModule,
    FacebookModule,
    InstagramModule,
    TiktokModule,
    CompetitorModule,
    ApifyModule,
  ],

  controllers: [PublicInsightsController],
})
export class PublicInsightsModule {}

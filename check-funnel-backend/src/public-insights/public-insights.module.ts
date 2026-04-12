import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicInsightsController } from './public-insights.controller';
import { ClientModule } from '../client/client.module';
import { FacebookModule } from '../facebook/facebook.module';
import { InstagramModule } from '../instagram/instagram.module';

@Module({
  imports: [
    ClientModule,
    FacebookModule,
    InstagramModule,
  ],
  controllers: [PublicInsightsController],
})
export class PublicInsightsModule {}

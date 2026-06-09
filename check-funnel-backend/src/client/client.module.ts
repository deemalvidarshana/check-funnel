import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { ClientService } from './client.service';
import { ClientInsightsReportService } from './client-insights-report.service';
import { ClientController } from './client.controller';
import { FacebookModule } from '../facebook/facebook.module';
import { InstagramModule } from '../instagram/instagram.module';
import { TiktokModule } from '../tiktok/tiktok.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    FacebookModule,
    InstagramModule,
    TiktokModule,
  ],
  providers: [ClientService, ClientInsightsReportService],

  controllers: [ClientController],
  exports: [ClientService],
})
export class ClientModule {}

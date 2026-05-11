import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApifyService } from './apify.service';
import { ApifyController } from './apify.controller';
import { ApifyPost } from './entities/apify-post.entity';
import { ApifyTrackedAccount } from './entities/apify-tracked-account.entity';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApifyPost, ApifyTrackedAccount]),
    SystemSettingsModule,
  ],
  controllers: [ApifyController],
  providers: [ApifyService],
  exports: [ApifyService],
})
export class ApifyModule {}

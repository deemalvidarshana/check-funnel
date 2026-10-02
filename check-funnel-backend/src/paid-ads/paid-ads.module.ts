import { Module } from '@nestjs/common';
import { ClientModule } from '../client/client.module';
import { PaidAdsController } from './paid-ads.controller';
import { PaidAdsService } from './paid-ads.service';

@Module({
  imports: [ClientModule],
  controllers: [PaidAdsController],
  providers: [PaidAdsService],
  exports: [PaidAdsService],
})
export class PaidAdsModule {}

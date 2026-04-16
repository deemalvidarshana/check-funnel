import { Module } from '@nestjs/common';
import { TiktokService } from './tiktok.service';

@Module({
  providers: [TiktokService],
  controllers: [],
  exports: [TiktokService],
})
export class TiktokModule {}


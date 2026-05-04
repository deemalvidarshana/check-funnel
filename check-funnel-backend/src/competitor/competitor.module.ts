import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitorController } from './competitor.controller';
import { CompetitorService } from './competitor.service';
import { TrackedAccount } from './entities/tracked-account.entity';
import { SocialMediaPost } from './entities/social-media-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrackedAccount, SocialMediaPost])],
  controllers: [CompetitorController],
  providers: [CompetitorService],
  exports: [CompetitorService],
})
export class CompetitorModule {}

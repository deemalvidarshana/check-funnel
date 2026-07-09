import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueCard } from './entities/issue-card.entity';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';

@Module({
  imports: [TypeOrmModule.forFeature([IssueCard])],
  controllers: [IssuesController],
  providers: [IssuesService],
})
export class IssuesModule {}

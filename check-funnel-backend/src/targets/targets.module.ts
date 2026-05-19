import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TargetSnapshot } from './entities/target-snapshot.entity';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';

@Module({
  imports: [TypeOrmModule.forFeature([TargetSnapshot])],
  controllers: [TargetsController],
  providers: [TargetsService],
})
export class TargetsModule {}

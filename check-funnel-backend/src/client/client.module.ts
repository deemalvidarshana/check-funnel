import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { TiktokService } from '../tiktok/tiktok.service';


@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [ClientService, TiktokService],

  controllers: [ClientController],
  exports: [ClientService],
})
export class ClientModule {}

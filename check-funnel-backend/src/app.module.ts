import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { FacebookModule } from './facebook/facebook.module';
import { InstagramModule } from './instagram/instagram.module';
import { UserModule } from './user/user.module';
import { PublicInsightsModule } from './public-insights/public-insights.module';
import { TiktokModule } from './tiktok/tiktok.module';
import { CompetitorModule } from './competitor/competitor.module';
import { User } from './auth/user.entity';
import { Client } from './client/client.entity';
import { TrackedAccount } from './competitor/entities/tracked-account.entity';
import { SocialMediaPost } from './competitor/entities/social-media-post.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Client, TrackedAccount, SocialMediaPost],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ClientModule,
    FacebookModule,
    InstagramModule,
    UserModule,
    PublicInsightsModule,
    TiktokModule,
    CompetitorModule,
  ],
})

export class AppModule {}
// Triggering rebuild


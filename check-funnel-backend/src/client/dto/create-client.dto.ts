// create-client.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  monthlyTargetPosts: number;

  @IsOptional()
  @IsString() // Accept as string
  hashtags?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  responsiblePersonId?: string;

  @IsOptional()
  @IsString()
  responsiblePersonName?: string;

  @IsOptional()
  @IsString() // Accept as string
  activeChannels?: string;

  @IsOptional()
  @IsString()
  facebookApiKey?: string;

  @IsOptional()
  @IsString()
  facebookPageId?: string;

  @IsOptional()
  @IsString()
  instagramApiKey?: string;

  @IsOptional()
  @IsString()
  instagramAccountId?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  tiktokUrl?: string;

  @IsOptional()
  @IsString()
  tiktokApiKey?: string;

  @IsOptional()
  @IsString()
  tiktokClientKey?: string;

  @IsOptional()
  @IsString()
  tiktokClientSecret?: string;

  @IsOptional()
  @IsString()
  tiktokRefreshToken?: string;
}

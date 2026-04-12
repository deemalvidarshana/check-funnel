import { IsString, IsNotEmpty, IsISO8601, IsOptional } from 'class-validator';

export class GetIgInsightsDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsISO8601()
  @IsOptional()
  until?: string;

  @IsOptional()
  timeRange?: string;
}

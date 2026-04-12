import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';

export class GetFbInsightsDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsISO8601()
  @IsNotEmpty()
  since: string;

  @IsISO8601()
  @IsNotEmpty()
  until: string;
}

import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class IgInsightRangeDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  since: string;

  @IsString()
  @IsNotEmpty()
  until: string;
}

export class GetIgRangeInsightsDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IgInsightRangeDto)
  ranges: IgInsightRangeDto[];
}

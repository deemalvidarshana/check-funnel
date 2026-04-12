import { IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status: string;
}

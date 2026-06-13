import { IsString, IsIn } from 'class-validator';

export class PresignDto {
  @IsString()
  filename: string;

  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  contentType: string;
}

import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';

export class GenerateClipDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(220)
  bpm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instruments?: string[];
}

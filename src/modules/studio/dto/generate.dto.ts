import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class GenerateDto {
  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsString()
  @IsOptional()
  mood?: string;

  @IsInt()
  @Min(40)
  @Max(300)
  @IsOptional()
  bpm?: number;

  @IsString()
  @IsOptional()
  key?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instruments?: string[];

  @IsString()
  @IsOptional()
  cover?: string;
}

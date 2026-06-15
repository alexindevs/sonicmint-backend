import {
  IsString,
  IsInt,
  IsPositive,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class CreateTrackDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  genre: string;

  @IsString()
  mood: string;

  @IsString()
  key: string;

  @IsInt()
  @Min(40)
  @Max(300)
  bpm: number;

  @IsInt()
  @IsPositive()
  durationSec: number;

  @IsString()
  s3RawKey: string;

  @IsString()
  cover: string;
}

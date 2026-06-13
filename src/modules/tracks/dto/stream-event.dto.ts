import { IsInt, IsPositive } from 'class-validator';

export class StreamEventDto {
  @IsInt()
  @IsPositive()
  durationSec: number;
}

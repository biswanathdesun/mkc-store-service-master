import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInHostelCartDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;
}

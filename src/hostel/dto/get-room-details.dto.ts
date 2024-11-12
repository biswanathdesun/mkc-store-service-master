import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetMappedRoomForHostelDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly hostelId: string;
}

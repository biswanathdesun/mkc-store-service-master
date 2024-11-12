import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetLiveClassForCalenderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  date: string;
}

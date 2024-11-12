import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PreeBookUserCourseDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class ByOnlineCourseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  readonly onlineCourseId: string[];
}

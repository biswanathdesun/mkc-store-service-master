import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetCourseSubjectsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly batchId: string;
}

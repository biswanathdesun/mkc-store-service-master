import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetStudentOfflineCourseDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly page: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly limit: string;
}

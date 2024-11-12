import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetSubjectChapterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly subjectId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly courseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly batchId: string;
}

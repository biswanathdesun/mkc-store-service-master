import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LibraryTypes } from 'src/utills/enum';
import { INVALID_COURSE_LIBRARY_TYPE } from 'src/utills/messages';

export class GetLibraryDto {
  @ApiProperty()
  @IsEnum(LibraryTypes, { message: INVALID_COURSE_LIBRARY_TYPE })
  @IsString()
  @IsOptional()
  type: LibraryTypes;

  @ApiProperty()
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subjectId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  chapterId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  topicId: string;
}

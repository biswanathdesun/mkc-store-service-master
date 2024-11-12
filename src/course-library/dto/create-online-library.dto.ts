import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  CHAPTER_ID_MANDATORY,
  INVALID_TYPE,
  ONLINE_COURSE_ID_MANDATORY,
  SUBJECT_ID_MANDATORY,
  VIDEO_TYPE_ERROR,
} from 'src/utills/messages';
import { CourseLibraryType, ModeTypes, VideoType } from 'src/utills/enum';
import { IsNonEmptyArray } from 'src/utills/is-non-empty-array.validator';

class PdfUrlItem {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly languageId: string;

  @ApiProperty()
  @IsOptional()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  thumbnail: string;

  @ApiProperty()
  @IsOptional()
  url: string;

  constructor(
    title: string,
    url: string,
    thumbnail: string,
    languageId: string,
  ) {
    this.title = title;
    this.url = url;
    this.thumbnail = thumbnail;
    this.languageId = languageId;
  }
}
class VideoUrlItem {
  @ApiProperty()
  @IsOptional()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  thumbnail: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(VideoType, { message: VIDEO_TYPE_ERROR })
  videoType: VideoType;

  @ApiProperty()
  @IsOptional()
  url: string;

  constructor(
    title: string,
    videoType: VideoType,
    url: string,
    thumbnail: string,
  ) {
    this.title = title;
    this.thumbnail = thumbnail;
    this.videoType = videoType;
    this.url = url;
  }
}
export class CreateCourseLibraryDto {
  @ApiProperty()
  @IsEnum(ModeTypes, { message: INVALID_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly courseType: ModeTypes;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty({ message: ONLINE_COURSE_ID_MANDATORY })
  @IsNonEmptyArray()
  @IsArray()
  readonly onlineCourseId: string[];

  @ApiProperty()
  @IsNotEmpty({ message: SUBJECT_ID_MANDATORY })
  @IsString()
  readonly subjectId: string;

  @ApiProperty()
  @IsNotEmpty({ message: CHAPTER_ID_MANDATORY })
  @IsString()
  readonly chapterId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  readonly topicId: string[];

  @ApiProperty()
  @IsEnum(CourseLibraryType, { message: INVALID_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly type: CourseLibraryType;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  pdfUrl: PdfUrlItem[];

  @ApiProperty()
  @IsOptional()
  videoUrl: VideoUrlItem[];

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly testMasterId: string[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  readonly status: boolean;
}

import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { INVALID_TYPE, VIDEO_TYPE_ERROR } from 'src/utills/messages';
import { CourseLibraryType, ModeTypes, VideoType } from 'src/utills/enum';

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

  constructor(title: string, url: string, thumbnail: string) {
    this.title = title;
    this.url = url;
    this.thumbnail = thumbnail;
  }
}

export class UpdateCourseLibraryDto {
  @ApiProperty()
  @IsEnum(ModeTypes, { message: INVALID_TYPE })
  @IsString()
  @IsOptional()
  readonly courseType: ModeTypes;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly title: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  readonly onlineCourseId: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly subjectId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly chapterId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly topicId: string[];

  @ApiProperty()
  @IsEnum(CourseLibraryType, { message: INVALID_TYPE })
  @IsString()
  @IsOptional()
  readonly type: CourseLibraryType;

  @ApiProperty()
  @IsOptional()
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

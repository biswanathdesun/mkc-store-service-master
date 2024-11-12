import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CourseContentType, ModeTypes } from 'src/utills/enum';
import { INVALID_MODE_TYPE } from 'src/utills/messages';

class ThumbnailItem {
  @ApiProperty()
  @IsOptional()
  url: string;

  constructor(url: string) {
    this.url = url;
  }
}

class VideoUrlItem {
  @ApiProperty()
  @IsOptional()
  url: string;

  constructor(url: string) {
    this.url = url;
  }
}

class Thumbnail {
  @ApiProperty()
  @IsOptional()
  imageUrl: ThumbnailItem[];

  @ApiProperty()
  @IsOptional()
  videoUrl: VideoUrlItem[];

  constructor(imageUrl: any[], videoUrl: any[]) {
    this.imageUrl = imageUrl;
    this.videoUrl = videoUrl;
  }
}

class ContentItem {
  @ApiProperty()
  @IsString()
  readonly title: string;

  @ApiProperty({ enum: CourseContentType })
  @IsEnum(CourseContentType)
  type: CourseContentType;

  @ApiProperty()
  @IsString()
  @IsOptional()
  pdfUrl: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  videoUrl: string;

  constructor(
    title: string,
    type: CourseContentType,
    imageUrl?: string,
    videoUrl?: string,
  ) {
    this.title = title;
    this.type = type;
    this.pdfUrl = imageUrl;
    this.videoUrl = videoUrl;
  }
}

export class CreateOnlineCourseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly categoryId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  readonly courseIds: string[];

  @ApiProperty({ enum: ModeTypes })
  @IsNotEmpty()
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  readonly type: ModeTypes;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly batchId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly slugUrl: string;

  @ApiProperty()
  @IsString()
  readonly shortDescription: string;

  @ApiProperty()
  @IsString()
  readonly longDescription: string;

  @ApiProperty()
  @IsArray()
  readonly features: string[];

  @ApiProperty()
  readonly registationDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly languageId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly priceId: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly liveClassCount: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly mockTestCount: number;

  @ApiProperty({ type: [String], isArray: true })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  readonly faqIds: string[];

  @ApiProperty({ type: Thumbnail })
  @ValidateNested({ each: true })
  @IsOptional()
  thumbnail: Thumbnail;

  @ApiProperty({ type: [ContentItem] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  courseContent: ContentItem[];

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly prebook_amount: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly admittedAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly coins: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly productCode: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  readonly topSeller: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  readonly status: boolean;
}

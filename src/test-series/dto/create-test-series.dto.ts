import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ModeTypes } from 'src/utills/enum';
import {
  CATEGORY_ID_MANDATORY,
  COURSE_ID_MANDATORY,
  BLANK_NAME_ERROR_MESSAGE,
  LANGUAGE_ID_MANDATORY,
  PRICE_ID_MANDATORY,
  BLANK_NO_OF_QUESTIONS_ERROR_MESSAGE,
  BLANK_NO_OF_QUESTION_PAPER_ERROR_MESSAGE,
  IMAGE_UPLOAD_ERROR,
  BLANK_SHORT_DESCRIPTION_ERROR_MESSAGE,
  BLANK_LONG_DESCRIPTION_ERROR_MESSAGE,
  BLANK_OVERVIEW_ERROR_MESSAGE,
  INVALID_MODE_TYPE,
} from 'src/utills/messages';

export class CreateTestSeriesDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  mode: ModeTypes;

  @IsNotEmpty({ message: CATEGORY_ID_MANDATORY })
  @ApiProperty()
  @IsString()
  readonly categoryId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsNotEmpty({ message: COURSE_ID_MANDATORY })
  @IsArray()
  @IsString({ each: true })
  readonly courseIds: string[];

  @ApiProperty()
  @IsNotEmpty({ message: BLANK_NAME_ERROR_MESSAGE })
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty({ message: BLANK_NAME_ERROR_MESSAGE })
  @IsString()
  readonly slugUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: BLANK_SHORT_DESCRIPTION_ERROR_MESSAGE })
  readonly shortDescription: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: BLANK_LONG_DESCRIPTION_ERROR_MESSAGE })
  readonly longDescription: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty({ message: BLANK_OVERVIEW_ERROR_MESSAGE })
  readonly overview: string[];

  @ApiProperty({ type: [String], isArray: true })
  @IsNotEmpty({ message: LANGUAGE_ID_MANDATORY })
  @IsArray()
  @IsString({ each: true })
  readonly languageIds: string[];

  @ApiProperty()
  @IsNotEmpty({ message: PRICE_ID_MANDATORY })
  @IsString()
  readonly priceId: string;

  @ApiProperty()
  @IsNotEmpty({ message: BLANK_NO_OF_QUESTIONS_ERROR_MESSAGE })
  @IsNumber()
  readonly noOfQuestions: number;

  @ApiProperty()
  @IsNotEmpty({ message: BLANK_NO_OF_QUESTION_PAPER_ERROR_MESSAGE })
  @IsNumber()
  readonly noOfQuestionPaper: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: IMAGE_UPLOAD_ERROR })
  readonly image: string;

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
}

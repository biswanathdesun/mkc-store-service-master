import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ModeTypes } from 'src/utills/enum';
import { INVALID_MODE_TYPE } from 'src/utills/messages';

export class UpdateTestSeriesDto {
  @ApiProperty()
  @IsOptional()
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  mode: ModeTypes;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly categoryId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly courseIds: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly slugUrl: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly shortDescription: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly longDescription: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  readonly overview: string[];

  @ApiProperty({ type: [String], isArray: true })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  readonly languageIds: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly priceId: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly noOfQuestions: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly noOfQuestionPaper: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
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

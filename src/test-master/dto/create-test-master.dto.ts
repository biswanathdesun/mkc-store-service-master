import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  OfflineModeType,
  TestMasterAttemptModeTypes,
  TestMasterTypes,
  TestStatus,
} from 'src/utills/enum';
import {
  CATEGORY_ID_MANDATORY,
  COURSE_ID_MANDATORY,
  BLANK_NAME_ERROR_MESSAGE,
  BLANK_DATE_TIME_ERROR_MESSAGE,
  BLANK_DURATION_ERROR_MESSAGE,
  INVALID_TEST_STATUS,
  BLANK_NO_OF_QUESTIONS_ERROR_MESSAGE,
  INVALID_MODE_TYPE,
} from 'src/utills/messages';

export class CreateTestMasterDto {
  @ApiProperty({ enum: TestMasterTypes })
  @IsNotEmpty()
  @IsEnum(TestMasterTypes, { message: INVALID_MODE_TYPE })
  readonly mode: TestMasterTypes;

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
  @IsOptional()
  @IsString()
  readonly batchId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly eventId: string;

  @ApiProperty({ enum: OfflineModeType })
  @IsOptional()
  @IsEnum(OfflineModeType, { message: INVALID_MODE_TYPE })
  readonly offlineMode: OfflineModeType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly examId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly paperId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsNotEmpty({ message: COURSE_ID_MANDATORY })
  @IsArray()
  @IsString({ each: true })
  readonly languageIds: string[];

  @ApiProperty()
  @IsNotEmpty({ message: BLANK_NAME_ERROR_MESSAGE })
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly slugUrl: string;

  @IsNotEmpty({ message: BLANK_DATE_TIME_ERROR_MESSAGE })
  @ApiProperty()
  @IsDateString()
  readonly startAfter: Date;

  @IsNotEmpty({ message: BLANK_DATE_TIME_ERROR_MESSAGE })
  @ApiProperty()
  @IsDateString()
  readonly startBefore: Date;

  @IsNotEmpty({ message: BLANK_DURATION_ERROR_MESSAGE })
  @ApiProperty()
  @IsNumber()
  readonly duration: number;

  @ApiProperty()
  @IsNotEmpty({ message: BLANK_NO_OF_QUESTIONS_ERROR_MESSAGE })
  @IsNumber()
  readonly noOfQuestions: number;

  @ApiProperty()
  @IsBoolean()
  readonly isFree: boolean;

  @ApiProperty({ enum: TestStatus })
  @IsNotEmpty({ message: INVALID_TEST_STATUS })
  @IsEnum(TestStatus, { message: INVALID_TEST_STATUS })
  readonly testStatus: TestStatus;

  @ApiProperty({ enum: TestMasterAttemptModeTypes })
  @IsOptional()
  @IsEnum(TestMasterAttemptModeTypes, { message: INVALID_TEST_STATUS })
  readonly attemptMode: TestMasterAttemptModeTypes;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly uniqueCode: number;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
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
import { INVALID_MODE_TYPE, INVALID_TEST_STATUS } from 'src/utills/messages';

export class UpdateTestMasterDto {
  @ApiProperty({ enum: TestMasterTypes })
  @IsOptional()
  @IsEnum(TestMasterTypes, { message: INVALID_MODE_TYPE })
  readonly mode: TestMasterTypes;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly categoryId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  readonly courseIds: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
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
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  readonly languageIds: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly slugUrl: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  readonly startAfter: Date;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  readonly startBefore: Date;

  @ApiProperty()
  @IsOptional()
  readonly duration: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly noOfQuestions: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  readonly isFree: boolean;

  @ApiProperty({ enum: TestStatus })
  @IsOptional()
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

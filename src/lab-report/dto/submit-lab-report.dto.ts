import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Gender,
  HealthCareTestDBType,
  TestNormalValueType,
  CompareValueRangeType,
} from 'src/utills/enum';
import { INVALID_GENDER, INVALID_TYPE } from 'src/utills/messages';

class NestedTestDetailsType {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly sequence: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name: string;

  @ApiProperty({ enum: TestNormalValueType })
  @IsOptional()
  @IsEnum(TestNormalValueType, { message: INVALID_TYPE })
  readonly valueType: TestNormalValueType;

  @ApiProperty({ enum: CompareValueRangeType })
  @IsOptional()
  @IsEnum(CompareValueRangeType, { message: INVALID_TYPE })
  readonly valueRange: CompareValueRangeType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly value: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly unitId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly reference: string;
}

class AllTestDetailsType {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly testDatabaseId: string;

  @ApiProperty({ enum: HealthCareTestDBType })
  @IsNotEmpty()
  @IsEnum(HealthCareTestDBType, { message: INVALID_TYPE })
  readonly type: HealthCareTestDBType;

  @ApiProperty({ type: [NestedTestDetailsType] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  readonly nestedTest: NestedTestDetailsType[];
}

class TestDetailsType {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly categoryId: string;

  @ApiProperty({ type: [AllTestDetailsType] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  readonly allTests: AllTestDetailsType[];
}

export class ModifyLabReportDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly reportId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly paymentId: string;

  @ApiProperty({ enum: Gender })
  @IsNotEmpty()
  @IsEnum(Gender, { message: INVALID_GENDER })
  readonly gender: Gender;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly age: number;

  @ApiProperty({ type: [TestDetailsType] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  testDetails: TestDetailsType[];
}

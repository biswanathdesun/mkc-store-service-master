import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AnswerKeyTypes,
  ApplicationType,
  TestSubmitType,
} from 'src/utills/enum';

export class TestResultDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly testId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly attemptCount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly userId: string;

  @ApiProperty({ enum: AnswerKeyTypes })
  @IsEnum(AnswerKeyTypes)
  @IsOptional()
  readonly type: AnswerKeyTypes;

  @ApiProperty({ enum: ApplicationType })
  @IsEnum(ApplicationType)
  @IsOptional()
  readonly application: ApplicationType;

  @ApiProperty({ enum: TestSubmitType })
  @IsEnum(TestSubmitType)
  @IsOptional()
  readonly mode: TestSubmitType;
}

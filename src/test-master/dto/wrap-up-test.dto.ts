import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AnswerType,
  QuestionResponseStatus,
  TestSubmitType,
  TestAttemptFromTypes,
} from 'src/utills/enum';
import {
  INVALID_ANSWER_TYPE,
  INVALID_MODE_TYPE,
  INVALID_TYPE,
} from 'src/utills/messages';

class QuestionsDetails {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly questionNo: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly uniqueId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(AnswerType, { message: INVALID_ANSWER_TYPE })
  answer: AnswerType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly spendTime: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(QuestionResponseStatus, { message: INVALID_TYPE })
  readonly responseStatus: QuestionResponseStatus;
}

export class WrapUpTestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly testId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly attemptCount: number;

  @ApiProperty({ enum: TestSubmitType })
  @IsNotEmpty()
  @IsEnum(TestSubmitType, { message: INVALID_MODE_TYPE })
  readonly mode: TestSubmitType;

  @ApiProperty({ enum: TestAttemptFromTypes })
  @IsOptional()
  @IsEnum(TestAttemptFromTypes, { message: INVALID_MODE_TYPE })
  readonly attemptedFrom: TestAttemptFromTypes;

  @ApiProperty({ type: [QuestionsDetails] })
  @IsNotEmpty()
  readonly questions: QuestionsDetails[];
}

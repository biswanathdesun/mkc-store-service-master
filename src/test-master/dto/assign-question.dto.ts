import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
} from 'class-validator';

class QuestionData {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly questionNo: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly uniqueId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly subjectId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly chapterIds: string[];

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly topicIds: string[];

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly difficultyLevels: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly questionTypeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly scoreSchemaId: string;
}

export class AssignQuestionDto {
  @ApiProperty()
  @IsString()
  readonly testId: string;

  @ApiProperty({ type: [QuestionData] })
  readonly questions: QuestionData[];
}

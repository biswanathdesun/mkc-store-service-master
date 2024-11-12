import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import {
  AnswerType,
  QuestionResponseStatus,
  TestAttemptFromTypes,
  TestMasterAttemptModeTypes,
  TestSubmitType,
} from 'src/utills/enum';
import { INVALID_ANSWER_TYPE, INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class TestResult extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'TestMaster' })
  testId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'QuestionBank' })
  questionId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  questionNo: number;

  @Prop({ required: true, type: Number })
  uniqueId: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subject', required: true })
  subjectIds: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'ScoreBoard' })
  scoreSchemaId: Types.ObjectId;

  @Prop({ required: false })
  @IsEnum(AnswerType, { message: INVALID_ANSWER_TYPE })
  answer: AnswerType;

  @Prop({ required: true })
  spendTime: string;

  @Prop({ required: true })
  @IsEnum(QuestionResponseStatus, { message: INVALID_TYPE })
  responseStatus: QuestionResponseStatus;

  @Prop({ required: true, type: Number })
  attemptCount: number;

  @Prop({ default: null })
  @IsEnum(TestMasterAttemptModeTypes, { message: INVALID_TYPE })
  attemptMode: TestMasterAttemptModeTypes;

  @Prop({ default: TestAttemptFromTypes.MOBILE })
  @IsEnum(TestAttemptFromTypes, { message: INVALID_TYPE })
  attemptedFrom: TestAttemptFromTypes;

  @Prop({ default: null })
  @IsEnum(TestSubmitType, { message: INVALID_TYPE })
  mode: TestSubmitType;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId;
}

export const TestResultSchema = SchemaFactory.createForClass(TestResult);

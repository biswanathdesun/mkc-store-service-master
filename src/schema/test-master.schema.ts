import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsDateString, IsEnum } from 'class-validator';
import {
  OfflineModeType,
  TestMasterAttemptModeTypes,
  TestStatus,
  TestMasterTypes,
} from 'src/utills/enum';
import {
  INVALID_MODE_TYPE,
  INVALID_TEST_STATUS,
  INVALID_TYPE,
} from 'src/utills/messages';

@Schema({ timestamps: true })
class AssignQuestion {
  @Prop({ required: true, type: Number })
  questionNo: number;

  @Prop({ required: true, type: Number })
  uniqueId: number;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'ScoreBoard' })
  scoreSchemaId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Subject' })
  subjectId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

@Schema({ timestamps: true })
export class TestMaster extends Document {
  @Prop({ default: null })
  @IsEnum(TestMasterTypes, { message: INVALID_MODE_TYPE })
  mode: TestMasterTypes;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({
    required: true,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Course' }],
  })
  courseIds: Types.ObjectId[];

  @Prop({
    required: false,
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Subject' }],
  })
  subjectIds: Types.ObjectId[];

  @Prop({
    required: true,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Language' }],
  })
  languageIds: Types.ObjectId[];

  @Prop({ default: null, type: Types.ObjectId, ref: 'Batch' })
  batchId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Event' })
  eventId: Types.ObjectId;

  @Prop({ required: false, default: null })
  @IsEnum(OfflineModeType, { message: INVALID_TYPE })
  offlineMode: OfflineModeType;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Exam' })
  examId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Subject' })
  paperId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  testNumber: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slugUrl: string;

  @Prop({ required: true, type: Date })
  @IsDateString()
  startAfter: Date;

  @Prop({ required: true, type: Number })
  duration: number;

  @Prop({ required: true, type: Date })
  @IsDateString()
  startBefore: Date;

  @Prop({ required: true, type: Number })
  noOfQuestions: number;

  @Prop({ required: true })
  @IsEnum(TestStatus, { message: INVALID_TEST_STATUS })
  testStatus: TestStatus;

  @Prop([{ required: false, default: null, type: AssignQuestion }])
  assignedQuestion: AssignQuestion[];

  @Prop({ default: null, type: Types.ObjectId, ref: 'ScoreSchema' })
  scoreSchemaId: Types.ObjectId;

  @Prop({ required: false, default: null, type: Types.ObjectId, ref: 'Price' })
  priceId: Types.ObjectId;

  @Prop({ default: false })
  isMapQuestions: boolean;

  @Prop({ default: false })
  isOmrResultUploaded: boolean;

  @Prop({ default: false })
  isFree: boolean;

  @Prop({ required: false, default: null })
  @IsEnum(TestMasterAttemptModeTypes, { message: INVALID_TYPE })
  attemptMode: TestMasterAttemptModeTypes;

  @Prop({ required: false, default: 0, type: Number })
  totalMarks: number;

  @Prop({ required: false, default: null, type: Number })
  uniqueCode: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const TestMasterSchema = SchemaFactory.createForClass(TestMaster);

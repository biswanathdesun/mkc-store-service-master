import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import { DifficultyLevelType } from 'src/utills/enum';
import { INVALID_DIFFICULY_LEVEL } from 'src/utills/messages';
import { TestMaster } from './test-master.schema';

@Schema({ timestamps: true })
export class TestDraftQuestion extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'TestMaster' })
  testMasterId: TestMaster['_id'];

  @Prop({ required: true })
  questionNo: number;

  @Prop({ required: false, default: null })
  uniqueId: number;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Subject',
  })
  subjectId: Types.ObjectId;

  @Prop({
    required: false,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Chapter' }],
  })
  chapterIds: Types.ObjectId[];

  @Prop({
    required: false,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Topic' }],
  })
  topicIds: Types.ObjectId[];

  @Prop({ required: false })
  @IsEnum(DifficultyLevelType, { message: INVALID_DIFFICULY_LEVEL })
  difficultyLevels: DifficultyLevelType[];

  @Prop({ required: false, type: SchemaTypes.ObjectId, ref: 'QuestionType' })
  questionTypeId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'ScoreBoard' })
  scoreSchemaId: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const TestDraftQuestionSchema =
  SchemaFactory.createForClass(TestDraftQuestion);

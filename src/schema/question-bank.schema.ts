import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum, IsString } from 'class-validator';
import { Document, Types, SchemaTypes } from 'mongoose';
import { AnswerType, DifficultyLevelType } from 'src/utills/enum';

import { Subject } from './subject.schema';
import { Chapter } from './chapter.schema';
import { Topic } from './topic.schema';
import { Language } from './language.schema';
import {
  INVALID_ANSWER_TYPE,
  INVALID_DIFFICULY_LEVEL,
} from 'src/utills/messages';

@Schema({ timestamps: true })
export class QuestionBank extends Document {
  @Prop({ required: true })
  uniqueId: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Language' })
  @IsString()
  languageId: Language['_id'];

  @Prop({ default: null })
  question: string;

  @Prop({ default: null })
  a: string;

  @Prop({ default: null })
  b: string;

  @Prop({ default: null })
  c: string;

  @Prop({ default: null })
  d: string;

  @Prop({ default: null })
  e: string;

  @Prop()
  @IsEnum(AnswerType, { message: INVALID_ANSWER_TYPE })
  answer: AnswerType;

  @Prop({ default: null })
  explanation: string;

  @Prop({ default: null })
  @IsEnum(DifficultyLevelType, { message: INVALID_DIFFICULY_LEVEL })
  difficultyLevels: DifficultyLevelType[];

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Subject',
  })
  subjectIds: Subject['_id'];

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Chapter' }],
  })
  chapterIds: Chapter['_id'][];

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Topic' }],
  })
  topicIds: Topic['_id'][];

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'QuestionType' })
  questionType: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const QuestionBankSchema = SchemaFactory.createForClass(QuestionBank);

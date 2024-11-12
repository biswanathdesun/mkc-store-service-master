import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { Subject } from './subject.schema';
import { Chapter } from './chapter.schema';
import { Topic } from './topic.schema';
import { OnlineCourse } from 'src/schema/online-course.schema';
import { Staff } from 'src/schema/staff.schema';
import { LiveClassType, PeriodTypes } from 'src/utills/enum';
import { Course } from './course.schema';
import { Batch } from './batch.schema';
import { INVALID_PERIOD } from 'src/utills/messages';
import { Category } from './category.schema';

@Schema({ timestamps: true })
export class LiveClass extends Document {
  @Prop({ default: null, type: [{ type: Types.ObjectId, ref: 'Category' }] })
  categoryId: Category['_id'][];

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Course' }],
  })
  @IsNotEmpty()
  courseIds: Course['_id'][];

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @Prop({ default: null })
  @IsString()
  @IsNotEmpty()
  image: string;

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'OnlineCourse' }],
  })
  @IsNotEmpty()
  onlineCourseId: OnlineCourse['_id'][];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subject' })
  @IsNotEmpty()
  subjectId: Subject['_id'];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Chapter' })
  @IsNotEmpty()
  chapterId: Chapter['_id'];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Topic' })
  @IsNotEmpty()
  topicId: Topic['_id'];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Staff' })
  @IsNotEmpty()
  teacherId: Staff['_id'];

  @Prop({ required: true, type: Date })
  @IsNotEmpty()
  @IsDateString()
  startTime: Date;

  @Prop({ required: true, type: Number })
  @IsNotEmpty()
  @IsNumber()
  duration: number;

  @Prop({ required: true, type: Date })
  @IsNotEmpty()
  @IsDateString()
  endTime: Date;

  @Prop({ type: Number })
  @IsNumber()
  meetingNumber: number;

  @Prop({ type: String })
  @IsString()
  password: string;

  @Prop({ default: false })
  isFree: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null })
  @IsString()
  @IsEnum({ enum: LiveClassType, default: LiveClassType.ZOOM_CLASS })
  liveClassType: string;

  @Prop({ default: null })
  liveStreamServer: string;

  @Prop({ default: null })
  liveStreamSecretKey: string;

  @Prop({ default: null })
  liveClassLink: string;

  @Prop({ type: Number, default: 0 })
  totalViewers: number;

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Batch' }],
  })
  batchIds: Batch['_id'][];

  @Prop({ default: null })
  @IsEnum(PeriodTypes, { message: INVALID_PERIOD })
  period: PeriodTypes;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const LiveClassSchema = SchemaFactory.createForClass(LiveClass);

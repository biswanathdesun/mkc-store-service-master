import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import { BatchDurationType, ModeTypes } from 'src/utills/enum';
import { INVALID_MODE_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class Batch extends Document {
  @Prop({ required: true, default: null })
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  type: ModeTypes;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({
    required: true,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Course' }],
  })
  courseIds: Types.ObjectId[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'OnlineCourse', default: null })
  offlineCourseId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  noOfSeats: number;

  @Prop({ required: true, default: BatchDurationType.DAYS })
  @IsEnum(BatchDurationType, { message: INVALID_MODE_TYPE })
  batchDurationType: BatchDurationType;

  @Prop({ required: false, type: Number })
  duration: number;

  @Prop({ required: false, type: Date })
  endDate: Date;

  @Prop({ required: true, default: 0, type: Number })
  occupiedSeats: number;

  @Prop({ required: true, type: Number })
  remaningSeat: number;

  @Prop({ required: false, type: SchemaTypes.ObjectId, ref: 'Slot' })
  slotId: Types.ObjectId;

  @Prop({ required: false, default: true })
  status: boolean;

  @Prop({ required: false, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ required: false, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsArray, IsBoolean, IsNotEmpty } from 'class-validator';
import { DaysOfWeekTypes } from 'src/utills/enum';
import { IsTimeFormat } from 'src/utills/timeFormat.validator';

@Schema({ timestamps: true })
export class InstructorAllocation extends Document {
  @Prop([{ required: true, type: SchemaTypes.ObjectId, ref: 'Batch' }])
  @IsNotEmpty()
  batchId: Types.ObjectId[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subject' })
  @IsNotEmpty()
  subjectId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Staff' })
  @IsNotEmpty()
  teacherId: Types.ObjectId;

  @Prop()
  @IsNotEmpty()
  @IsTimeFormat()
  startTime: string;

  @Prop()
  @IsNotEmpty()
  @IsTimeFormat()
  endTime: string;

  @Prop()
  @IsArray()
  weekdays: DaysOfWeekTypes[];

  @Prop({ default: true })
  @IsBoolean()
  status: boolean;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const InstructorAllocationSchema =
  SchemaFactory.createForClass(InstructorAllocation);

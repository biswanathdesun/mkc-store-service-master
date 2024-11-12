import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

@Schema({ timestamps: true })
export class LessonPlanner extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Batch' })
  @IsNotEmpty()
  batchId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subject' })
  @IsNotEmpty()
  subjectId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Chapter' })
  @IsNotEmpty()
  chapterId: Types.ObjectId;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  month: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  lecture: number;

  @Prop({ default: true })
  @IsBoolean()
  status: boolean;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const LessonPlannerSchema = SchemaFactory.createForClass(LessonPlanner);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Staff } from './staff.schema';

@Schema({ timestamps: true })
export class Exam extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Staff['_id'];

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  updatedBy: Staff['_id'];
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

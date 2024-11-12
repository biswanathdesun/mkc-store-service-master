import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class PreviousCourseHistory extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'OnlineCourseId' })
  previousCourseId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'OnlineCourseId' })
  currentCourseId: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const PreviousCourseHistorySchema = SchemaFactory.createForClass(
  PreviousCourseHistory,
);

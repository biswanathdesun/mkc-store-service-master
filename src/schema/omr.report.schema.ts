import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class OmrReport extends Document {
  @Prop({ required: false })
  enrollmentNumber: string;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'User',
  })
  studentId: Types.ObjectId;

  @Prop({ required: false })
  candidateName: string;

  @Prop({ default: null, required: false })
  father: string;

  @Prop({ required: false })
  group: string;

  @Prop({ default: null })
  other: string;

  @Prop({ default: null, type: Number })
  testNo: number;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'TestMaster' })
  testId: Types.ObjectId;

  @Prop({ required: true })
  testName: string;

  @Prop({ required: false, type: [SchemaTypes.Mixed] })
  subjectDetails: Array<Record<string, any>>;

  @Prop({ required: true, type: Number })
  totalQuestion: number;

  @Prop({ required: true, type: Number })
  totalAttemptedQuestion: number;

  @Prop({ required: true, type: Number })
  totalRightQuestion: number;

  @Prop({ required: true, type: Number })
  totalWrongQuestion: number;

  @Prop({ required: true, type: Number })
  totalUnattemptedQuestion: number;

  @Prop({ required: true, type: Number })
  rightPercentage: number;

  @Prop({ required: true, type: Number })
  wrongPercentage: number;

  @Prop({ required: true, type: Number })
  total: number;

  @Prop({ required: true, type: Number })
  testRank: number;

  @Prop({ required: true, type: Number })
  finalRank: number;

  @Prop({ required: true, type: Number })
  percentage: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const OmrReportSchema = SchemaFactory.createForClass(OmrReport);

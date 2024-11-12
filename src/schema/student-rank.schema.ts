import { Document, SchemaTypes, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class StudentRank extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'TestMaster' })
  testId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  rank: number;

  @Prop({ required: true, type: Number })
  percentage: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Staff',
  })
  createdBy: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Staff',
  })
  updatedBy: Types.ObjectId;
}

export const StudentRankSchema = SchemaFactory.createForClass(StudentRank);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Schema({ timestamps: true })
export class StudentBatch extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({
    default: null,
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'Batch',
  })
  batchId: Types.ObjectId;

  @Prop({
    default: null,
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'MasterBatch',
  })
  @IsString()
  @IsOptional()
  masterBatchId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'OnlineCourse' })
  @IsNotEmpty()
  @IsString()
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({ default: null, required: false })
  rollNumber: string;

  @Prop({ default: null, required: false })
  masterRollNumber: string;

  @Prop({ default: null })
  newEnrollmentNumber: string;

  @Prop({ default: null })
  oldEnrollmentNumber: string;

  @Prop({ default: false })
  isDroppedStatus: boolean;

  @Prop({ default: null })
  droppedRemark: string;

  @Prop({ default: null })
  droppedDate: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const StudentBatchSchema = SchemaFactory.createForClass(StudentBatch);

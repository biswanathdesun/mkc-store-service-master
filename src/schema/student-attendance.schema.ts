import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDateString, IsEnum } from 'class-validator';
import { Document, Types, SchemaTypes } from 'mongoose';
import { AttendanceTypes } from 'src/utills/enum';
import { INVALID_ATTENDANCE_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class StudentAttendance extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  studentId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'StudentBatch' })
  studentBatchId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Batch' })
  batchId: Types.ObjectId;

  @Prop({ default: null })
  @IsEnum(AttendanceTypes, { message: INVALID_ATTENDANCE_TYPE })
  attendance: AttendanceTypes;

  @Prop({ type: Date, required: true })
  @IsDateString()
  date: Date;

  @Prop({ default: null })
  remark: string;

  @Prop({ default: null, required: false })
  remarkDate: Date;

  @Prop({ default: false })
  isNotRusticated: boolean;

  @Prop({ default: false })
  isFinePaid: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;
}

export const StudentAttendanceSchema =
  SchemaFactory.createForClass(StudentAttendance);

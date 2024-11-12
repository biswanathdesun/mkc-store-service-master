import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document, SchemaTypes } from 'mongoose';
import { IsDateString, IsEnum } from 'class-validator';
import {
  LiveAttendanceType,
  LiveClassType,
  PeriodTypes,
} from 'src/utills/enum';
import {
  INVALID_ATTENDANCE,
  INVALID_PERIOD,
  INVALID_TYPE,
} from 'src/utills/messages';

@Schema({ timestamps: true })
class ClassLog {
  @Prop({ required: true, type: Date })
  joiningTime: Date;

  @Prop({ required: false, type: Date, default: null })
  leavingTime: Date;
}

@Schema({ timestamps: true })
export class AttendanceReport extends Document {
  @Prop({ required: true, default: LiveClassType.LIVE_STREAM })
  @IsEnum(LiveClassType, { message: INVALID_TYPE })
  liveClassType: LiveClassType;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'LiveClass' })
  liveClassId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'OnlineCourse' })
  onlineCourseId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Batch' })
  batchId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subject' })
  subjectId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Chapter' })
  chapterId: Types.ObjectId;

  @Prop({ default: null })
  @IsEnum(PeriodTypes, { message: INVALID_PERIOD })
  period: PeriodTypes;

  @Prop({ default: LiveAttendanceType.NOT_MARKED })
  @IsEnum(LiveAttendanceType, { message: INVALID_ATTENDANCE })
  periodAttendance: LiveAttendanceType;

  @Prop({ default: LiveAttendanceType.NOT_MARKED })
  @IsEnum(LiveAttendanceType, { message: INVALID_ATTENDANCE })
  attendance: LiveAttendanceType;

  @Prop([{ required: false, type: ClassLog, default: null }])
  classLog: ClassLog[];

  @Prop({ type: Number, default: 0 })
  totalTime: number; //TODO - it will only update upto the live claass end time

  @Prop({ default: false })
  isPresentAfterLiveClass: boolean;

  @Prop({ type: Date, required: false, default: null })
  @IsDateString()
  attendanceDate: Date;

  @Prop({ default: null })
  remark: string;

  @Prop({ required: false, default: null, type: Date })
  remarkDate: Date;

  @Prop({ default: false })
  isFinePaid: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: false, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ required: false, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const AttendanceReportSchema =
  SchemaFactory.createForClass(AttendanceReport);

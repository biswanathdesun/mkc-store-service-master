import { Document, SchemaTypes, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDateString, IsEnum } from 'class-validator';
import {
  AttendanceTypes,
  OfflinePaymentType,
  OrderTypes,
  PaymentStatus,
  SchemaReferenceType,
} from 'src/utills/enum';
import {
  INVALID_ATTENDANCE_TYPE,
  INVALID_TYPE,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_PAYMENT_STATUS,
} from 'src/utills/messages';
import { Staff } from './staff.schema';
import { User } from './user.schema';
import { StudentAttendance } from './student-attendance.schema';
import { AttendanceReport } from './live-attendance-report.schema';

@Schema({ timestamps: true })
export class FineTracker extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  parentId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    required: false,
    ref: 'Order',
    default: null,
  })
  orderId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: false, ref: 'Payment' })
  paymentId: Types.ObjectId;

  @Prop({ default: null })
  razorpay_payment_id: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'Batch' })
  batchId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'StudentBatch' })
  studentBatchId: Types.ObjectId;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'attendanceModel', //TODO: Dynamic reference based on attendanceModel
  })
  attendanceId:
    | Types.ObjectId
    | StudentAttendance['_id']
    | AttendanceReport['_id'];

  @Prop({
    default: null,
    enum: [
      SchemaReferenceType.OFFLINE_ATTENDANCE,
      SchemaReferenceType.ONLINE_ATTENDANCE,
      null,
    ], //TODO: Possible values for attendanceModel
  })
  attendanceModel:
    | SchemaReferenceType.OFFLINE_ATTENDANCE
    | SchemaReferenceType.ONLINE_ATTENDANCE;

  @Prop({ default: false })
  isRemarkAdded: boolean;

  @Prop({ default: null })
  remark: string;

  @Prop({ default: null })
  remarkDate: Date;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: null })
  chequeOrTransNo: string;

  @Prop({ required: false, default: null })
  paymentDate: Date;

  @Prop({ required: false })
  receiptNumber: string;

  @Prop({ default: OrderTypes.AUTOMATION })
  @IsEnum(OrderTypes, { message: INVALID_TYPE })
  orderType: OrderTypes;

  @Prop({ required: true, default: OfflinePaymentType.UPI })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  paymentType: OfflinePaymentType;

  @Prop({ default: null })
  @IsEnum(AttendanceTypes, { message: INVALID_ATTENDANCE_TYPE })
  attendanceStatus: AttendanceTypes;

  @Prop({ required: true, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus, { message: INVALID_PAYMENT_STATUS })
  paymentStatus: PaymentStatus;

  @Prop({ default: true })
  isActiveForPayment: boolean;

  @Prop({ type: Date, required: false, default: null })
  @IsDateString()
  attendanceDate: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy: Types.ObjectId | User['_id'] | Staff['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.USER, SchemaReferenceType.STAFF, null], //TODO: Possible values for createdByModel
  })
  createdByModel: SchemaReferenceType.USER | SchemaReferenceType.STAFF;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy: Types.ObjectId | User['_id'] | Staff['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.USER, SchemaReferenceType.STAFF], //TODO: Possible values for updatedByModel
  })
  updatedByModel: SchemaReferenceType.USER | SchemaReferenceType.STAFF;
}

export const FineTrackerSchema = SchemaFactory.createForClass(FineTracker);

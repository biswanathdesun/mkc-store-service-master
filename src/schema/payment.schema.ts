import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import {
  PaymentStatus,
  OfflinePaymentType,
  FeeTypes,
  UserType,
} from 'src/utills/enum';
import { Staff } from './staff.schema';
import {
  INVALID_PAYMENT_STATUS,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_TYPE,
} from 'src/utills/messages';
import { User } from './user.schema';

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ default: null, type: Types.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({ default: null, types: Types.ObjectId, ref: 'OnlineCourse' })
  courseId: Types.ObjectId;

  @Prop({ default: null })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  parentId: Types.ObjectId;

  @Prop({ default: null })
  paymentId: string;

  @Prop({ default: 0 })
  productAmount: number;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @Prop({ default: 0 })
  totalAmtReceived: number;

  @Prop({ required: true, default: Date.now })
  paymentDate: Date;

  @Prop({ required: true, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus, { message: INVALID_PAYMENT_STATUS })
  paymentStatus: PaymentStatus;

  @Prop({ default: 0 })
  outstandingAmount: number;

  @Prop({ default: OfflinePaymentType.UPI })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  paymentType: OfflinePaymentType;

  @Prop({ default: null })
  chequeOrTransNo: string;

  @Prop({ default: null })
  nextPaymentDate: Date;

  @Prop({ default: null })
  extendedPaymentDate: Date;

  @Prop({ default: null })
  receiptNumber: string;

  @Prop({ default: null })
  invoiceNumber: string;

  @Prop({ default: FeeTypes.PRODUCT_PURCHASE })
  @IsEnum(FeeTypes, { message: INVALID_TYPE })
  feeType: FeeTypes;

  @Prop({ default: UserType.STUDENT })
  @IsEnum(UserType, { message: INVALID_TYPE })
  purchaseBy: UserType;

  @Prop({ default: false })
  isPaymentUpdated: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: [
      { type: Types.ObjectId, ref: 'Staff' },
      { type: Types.ObjectId, ref: 'User' },
    ],
  })
  createdBy: Types.ObjectId | Staff['_id'] | User['_id'];

  @Prop({
    default: null,
    type: [
      { type: Types.ObjectId, ref: 'Staff' },
      { type: Types.ObjectId, ref: 'User' },
    ],
  })
  updatedBy: Types.ObjectId | Staff['_id'] | User['_id'];
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

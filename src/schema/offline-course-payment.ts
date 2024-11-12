import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import {
  TransactionStatus,
  OfflineCoursePriceType,
  PaymentStatus,
  OfflinePaymentType,
  UserType,
  ProductType,
} from 'src/utills/enum';
import {
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_PAYMENT_STATUS,
  INVALID_PRODUCT_TYPE,
  INVALID_TYPE,
} from 'src/utills/messages';
import { Staff } from './staff.schema';

@Schema({ timestamps: true })
export class OfflineCoursePayment extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  parentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Order' })
  parentOrderId: Types.ObjectId;

  @Prop({ types: Types.ObjectId, default: null, ref: 'OnlineCourse' })
  courseId: Types.ObjectId;

  @Prop()
  @IsEnum(ProductType, { message: INVALID_PRODUCT_TYPE })
  productType: ProductType;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  productAmount: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  gst: number;

  @Prop()
  @IsOptional()
  @IsNumber()
  cgst: number;

  @Prop()
  @IsOptional()
  @IsNumber()
  sgst: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  gstAmount: number;

  @Prop()
  @IsOptional()
  @IsNumber()
  cgstAmount: number;

  @Prop()
  @IsOptional()
  @IsNumber()
  sgstAmount: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  discountPercentage: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  discountedPrice: number;

  @Prop({ default: 0 })
  @IsNumber()
  @IsNotEmpty()
  outstandingAmount: number;

  @Prop({ default: null })
  totalAmtReceived: number;

  @Prop({ default: null, type: Date })
  @IsOptional()
  nextPaymentDate: Date;

  @Prop({ default: null })
  extendedPaymentDate: Date;

  @Prop({ default: true })
  addExtendedDate: boolean;

  @Prop({ default: null })
  @IsEnum(OfflineCoursePriceType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  priceType: OfflineCoursePriceType;

  @Prop({ default: null })
  @IsEnum(TransactionStatus, { message: INVALID_PAYMENT_STATUS })
  transactionStatus: TransactionStatus;

  @Prop({ required: true, default: Date.now })
  paymentDate: Date;

  @Prop({ default: null })
  chequeOrTransNo: string;

  @Prop({ required: true, default: PaymentStatus.PAID })
  @IsEnum(PaymentStatus, { message: INVALID_PAYMENT_STATUS })
  paymentStatus: PaymentStatus;

  @Prop({ default: null })
  receiptNumber: string;

  @Prop({ required: true, default: OfflinePaymentType.UPI })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  paymentType: OfflinePaymentType;

  @Prop({ default: UserType.STUDENT })
  @IsEnum(UserType, { message: INVALID_TYPE })
  purchaseBy: UserType;

  @Prop({ default: false })
  isPaymentUpdated: boolean;

  @Prop({ required: false, default: null })
  remarks: string;

  @Prop({ default: null })
  remarkDate: Date;

  @Prop({ default: false })
  isDroppedStatus: boolean;

  @Prop({ default: null })
  droppedRemark: string;

  @Prop({ default: null })
  droppedDate: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Staff['_id'];

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  updatedBy: Staff['_id'];
}

export const OfflineCoursePaymentSchema =
  SchemaFactory.createForClass(OfflineCoursePayment);

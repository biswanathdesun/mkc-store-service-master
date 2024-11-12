import { Document, SchemaTypes, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import {
  TransactionStatus,
  PaymentStatus,
  UserType,
  OfflineCoursePriceType,
  OfflinePaymentType,
  HealthCarePurchaseType,
} from 'src/utills/enum';
import {
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_PAYMENT_STATUS,
  INVALID_TYPE,
} from 'src/utills/messages';
import { Staff } from './staff.schema';
import { HealthcareUser } from './health-care-user.schema';

@Schema({ timestamps: true })
export class HealthCareFinance extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HealthcareUser' })
  userId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    required: false,
    default: null,
    ref: 'HealthcareUser',
  })
  parentId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HospitalOrder' })
  orderId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, default: null, ref: 'HospitalOrder' })
  parentOrderId: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'CarePackage',
  })
  packageId: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'CareService',
  })
  serviceId: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'HealthCareTestDatabase' }],
  })
  testDatabaseId: Types.ObjectId[];

  @Prop({ required: true, type: Number })
  productAmount: number;

  @Prop({ required: true, type: Number })
  totalPrice: number;

  @Prop({ required: true, type: Number })
  gst: number;

  @Prop({ required: true, type: Number })
  cgst: number;

  @Prop({ required: true, type: Number })
  sgst: number;

  @Prop({ required: true, type: Number })
  gstAmount: number;

  @Prop({ required: true, type: Number })
  cgstAmount: number;

  @Prop({ required: true, type: Number })
  sgstAmount: number;

  @Prop({ required: true, type: Number })
  discountPercentage: number;

  @Prop({ required: true, type: Number })
  discountedPrice: number;

  @Prop({ required: true, default: 0, type: Number })
  outstandingAmount: number;

  @Prop({ required: true, default: 0, type: Number })
  totalAmtReceived: number;

  @Prop({ required: false, default: null, type: Date })
  nextPaymentDate: Date;

  @Prop({ required: false, default: null, type: Date })
  extendedPaymentDate: Date;

  @Prop({ default: OfflineCoursePriceType.DISCOUNT_PRICE })
  @IsEnum(OfflineCoursePriceType, { message: INVALID_TYPE })
  priceType: OfflineCoursePriceType;

  @Prop({ default: TransactionStatus.FULL_PAYMENT })
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

  @Prop({ default: HealthCarePurchaseType.CARE_PACKAGE })
  @IsEnum(HealthCarePurchaseType, { message: INVALID_TYPE })
  purchaseProductType: HealthCarePurchaseType;

  @Prop({ default: false })
  isLabReportAdded: boolean;

  @Prop({ default: false })
  isLiveConsulting: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'LabReport' })
  reportId: Types.ObjectId;

  @Prop({ default: false })
  addExtendedDate: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy: Types.ObjectId | HealthcareUser['_id'] | Staff['_id'];

  @Prop({
    default: null,
    enum: ['HealthcareUser', 'Staff'], //TODO: Possible values for createdByModel
  })
  createdByModel: 'HealthcareUser' | 'Staff';

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy: Types.ObjectId | HealthcareUser['_id'] | Staff['_id'];

  @Prop({
    default: null,
    enum: ['HealthcareUser', 'Staff'], //TODO: Possible values for updatedByModel
  })
  updatedByModel: 'HealthcareUser' | 'Staff';

  @Prop({ default: true })
  status: boolean;
}

export const HealthCareFinanceSchema =
  SchemaFactory.createForClass(HealthCareFinance);

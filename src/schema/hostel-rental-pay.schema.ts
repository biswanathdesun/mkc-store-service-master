import { Document, SchemaTypes, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import {
  PaymentStatus,
  UserType,
  OfflinePaymentType,
  HostelPaymentType,
  BedTypes,
  Gst,
  HostelPriceType,
  SchemaReferenceType,
  MiscellaneousCostHostelType,
  HostelTransactionStatus,
  BankDetailsType,
} from 'src/utills/enum';
import {
  INVALID_BED_TYPE,
  INVALID_GST,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_PAYMENT_STATUS,
  INVALID_TYPE,
} from 'src/utills/messages';
import { Staff } from './staff.schema';
import { HostelEnquiry } from './hostel-enquiry.schema';

@Schema({ timestamps: true })
class MiscellaneousCostDetails {
  @Prop({ required: true })
  @IsEnum(MiscellaneousCostHostelType, { message: INVALID_TYPE })
  reason: MiscellaneousCostHostelType;

  @Prop({ required: true, type: Number })
  amount: number;
}

@Schema({ timestamps: true })
export class HostelRentalPay extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HostelEnquiry' })
  userId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    required: false,
    default: null,
    ref: 'User',
  })
  parentId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HostelOrder' })
  orderId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, default: null, ref: 'HostelOrder' })
  parentOrderId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Hostel' })
  hostelId: Types.ObjectId;

  @Prop({ required: true, default: HostelPaymentType.MONTH_WISE })
  @IsEnum(HostelPaymentType, { message: INVALID_PAYMENT_STATUS })
  type: HostelPaymentType;

  @Prop({ required: false, type: Number })
  roomNumber: number;

  @Prop({ required: false, type: Number })
  floorNumber: number;

  @Prop({ required: false })
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  bedType: BedTypes;

  @Prop({ default: 1, type: Number })
  monthCount: number;

  @Prop({ default: 0, type: Number })
  daysCount: number; //TODO - days count will come if type month wise (it's optional)

  @Prop({ default: 0, type: Number })
  discountedAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  securityFee: number;

  @Prop({ required: false, type: Number, default: 0 })
  paidSecurityFee: number;

  @Prop({ required: false, type: Number, default: 0 })
  securityFeeOutStanding: number;

  @Prop({ required: false, type: Number, default: 0 })
  settledAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  adjustedAmount: number;

  @Prop({ default: null })
  securityReason: string;

  @Prop({ required: false, type: Number, default: 0 })
  netHostelCharge: number;

  @Prop({ required: false, type: Number, default: 0 })
  hostelCharge: number; //NOTE - with GST

  @Prop({ required: false, default: null })
  @IsEnum(Gst, { message: INVALID_GST })
  hostelGst: Gst;

  @Prop({ required: false, type: Number, default: 0 })
  hostelGstAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  hostelPaidAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  hostelOutstanding: number;

  @Prop({ required: false, type: Number, default: 0 })
  netAccommodationCost: number;

  @Prop({ required: false, type: Number, default: 0 })
  accommodationCost: number; //NOTE - with GST

  @Prop({ required: false, default: null })
  @IsEnum(Gst, { message: INVALID_GST })
  accommodationGst: Gst;

  @Prop({ required: false, type: Number, default: 0 })
  accommodationGstAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  accommodationPaidAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  accommodationOutstanding: number;

  @Prop({ required: false, type: Number, default: 0 })
  netMealCost: number;

  @Prop({ required: false, type: Number, default: 0 })
  mealCost: number; //NOTE - with GST

  @Prop({ required: false, default: null })
  @IsEnum(Gst, { message: INVALID_GST })
  mealGst: Gst;

  @Prop({ required: false, type: Number, default: 0 })
  mealGstAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  mealPaidAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  mealOutstanding: number;

  @Prop({ required: false, type: Number, default: 0 })
  totalGst: number;

  @Prop({ required: false, type: Number, default: 0 })
  perDayCost: number;

  @Prop({ required: false, type: Number, default: 0 })
  totalDays: number;

  @Prop({ required: false, type: Number })
  totalAmountWithSecurity: number; //TODO - all actual amount addition with security

  @Prop({ required: false, type: Number })
  totalAmountWithOutSecurity: number; //TODO - all actual amount addition without security

  @Prop({ required: false, default: 0, type: Number })
  paidAmount: number; //TODO - amount paid by user without security and miscellaneousCost

  @Prop({ required: false, default: 0, type: Number })
  totalPaidAmount: number; //TODO - amount paid by user with security and miscellaneousCost

  @Prop({ required: false, default: 0, type: Number })
  outstandingAmount: number;

  @Prop({ required: false, default: 0, type: Number })
  totalAmtReceived: number; //TODO - amount paid by user with security

  @Prop({ required: false, default: null, type: Date })
  nextPaymentDate: Date;

  @Prop({ required: false, default: null, type: Date })
  extendedPaymentDate: Date;

  @Prop([{ required: false, type: MiscellaneousCostDetails }])
  miscellaneousCost: MiscellaneousCostDetails[];

  @Prop({ default: HostelPriceType.FULL_PAYMENT })
  @IsEnum(HostelPriceType, { message: INVALID_TYPE })
  priceType: HostelPriceType;

  @Prop({ default: HostelTransactionStatus.AUTO_FULL_PAYMENT })
  @IsEnum(HostelTransactionStatus, { message: INVALID_PAYMENT_STATUS })
  transactionStatus: HostelTransactionStatus;

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

  @Prop({ required: false, default: null })
  @IsEnum(BankDetailsType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  bankDetails: BankDetailsType;

  @Prop({ default: UserType.HOSPITAL_ENQUIRY })
  @IsEnum(UserType, { message: INVALID_TYPE })
  purchaseBy: UserType;

  @Prop({ default: false })
  addExtendedDate: boolean;

  @Prop({ default: false })
  isGstApplicable: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy: Types.ObjectId | HostelEnquiry['_id'] | Staff['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HOSTEL_USER, SchemaReferenceType.STAFF], //TODO: Possible values for createdByModel
  })
  createdByModel: SchemaReferenceType.HOSTEL_USER | SchemaReferenceType.STAFF;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy: Types.ObjectId | HostelEnquiry['_id'] | Staff['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HOSTEL_USER, SchemaReferenceType.STAFF], //TODO: Possible values for updatedByModel
  })
  updatedByModel: SchemaReferenceType.HOSTEL_USER | SchemaReferenceType.STAFF;
}

export const HostelRentalPaySchema =
  SchemaFactory.createForClass(HostelRentalPay);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import {
  PaymentStatus,
  OrderTypes,
  UserType,
  BedTypes,
  HostelPriceType,
  HostelPaymentType,
  SchemaReferenceType,
  OfflinePaymentType,
  Gst,
  MiscellaneousCostHostelType,
  BankDetailsType,
} from 'src/utills/enum';
import {
  INVALID_PAYMENT_STATUS,
  INVALID_MODE_TYPE,
  INVALID_TYPE,
  INVALID_BED_TYPE,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_GST,
} from 'src/utills/messages';
import { Staff } from './staff.schema';
import { HostelEnquiry } from './hostel-enquiry.schema';

@Schema({ timestamps: true })
class MonthlyPaymentDetails {
  @Prop({ required: true, type: Number })
  securityFee: number;

  @Prop({ required: true, type: Number })
  paidSecurityFee: number;

  @Prop({ required: true, type: Number })
  hostelCharge: number;

  @Prop({ required: true })
  @IsEnum(Gst, { message: INVALID_GST })
  hostelGst: Gst;

  @Prop({ required: true, type: Number })
  hostelPaidAmount: number;

  @Prop({ required: true, type: Number })
  accommodationCost: number;

  @Prop({ required: true })
  @IsEnum(Gst, { message: INVALID_GST })
  accommodationGst: Gst;

  @Prop({ required: true, type: Number })
  accommodationPaidAmount: number;

  @Prop({ required: true, type: Number })
  mealCost: number;

  @Prop({ required: true })
  @IsEnum(Gst, { message: INVALID_GST })
  mealGst: Gst;

  @Prop({ required: true, type: Number })
  mealPaidAmount: number;

  @Prop({ required: true, type: Number })
  totalGst: number;

  @Prop({ required: true, type: Number })
  totalAmount: number; //TODO - all actual amount addition

  @Prop({ required: true, type: Number })
  paidAmount: number; //TODO - amount paid by user
}
@Schema({ timestamps: true })
class DayWisePaymentDetails {
  @Prop({ required: false, type: Number, default: 0 })
  securityFee: number;

  @Prop({ required: true, type: Number })
  perDayCost: number;

  @Prop({ required: true, type: Number })
  totalDays: number;

  @Prop({ required: true, type: Number })
  totalAmount: number; //TODO - all actual amount addition

  @Prop({ required: true, type: Number })
  paidAmount: number; //TODO - amount paid by user
}
@Schema({ timestamps: true })
class MiscellaneousDetails {
  @Prop({ required: true })
  @IsEnum(MiscellaneousCostHostelType, { message: INVALID_TYPE })
  reason: MiscellaneousCostHostelType;

  @Prop({ required: true, type: Number })
  amount: number;
}
@Schema({ timestamps: true })
export class HostelOrder extends Document {
  @Prop({ required: true, unique: true })
  mkcOrderId: string;

  @Prop({ default: null })
  orderNumber: string; //TODO - will be hdfc id

  @Prop({ default: null })
  paymentId: string; //TODO - will be the txn_id of hdfc

  @Prop({ default: null })
  payment_method_type: string; //TODO - it will hdfc payment_method_type

  @Prop({ default: null })
  payment_method: string; //TODO - it will hdfc payment_method

  @Prop({ type: SchemaTypes.ObjectId, default: null })
  parentOrderId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HostelEnquiry' })
  userId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'HostelEnquiry' })
  parentId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Hostel' })
  hostelId: Types.ObjectId;

  @Prop({ required: false, type: Number, default: null })
  roomNumber: number;

  @Prop({ required: false, type: Number, default: null })
  floorNumber: number;

  @Prop({ required: true })
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  bedType: BedTypes;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Coupon' })
  couponId: Types.ObjectId;

  @Prop({ default: null, required: false })
  couponAmount: number;

  @Prop({ default: 0, type: Number })
  walletAmount: number;

  @Prop({ required: true, default: () => new Date().toISOString() })
  paymentDate: Date;

  @Prop({ required: true, default: HostelPaymentType.MONTH_WISE })
  @IsEnum(HostelPaymentType, { message: INVALID_PAYMENT_STATUS })
  type: HostelPaymentType;

  @Prop({ default: 1, type: Number })
  monthCount: number;

  @Prop({ default: 0, type: Number })
  daysCount: number; //TODO - days count will come if type month wise (it's optional)

  @Prop({ default: 0, type: Number })
  discountedAmount: number;

  @Prop({ required: false, type: MonthlyPaymentDetails, default: null })
  monthlyPaymentDetail: MonthlyPaymentDetails;

  @Prop({ required: false, type: DayWisePaymentDetails, default: null })
  daywisePaymentDetail: DayWisePaymentDetails;

  @Prop([{ required: false, type: MiscellaneousDetails }])
  miscellaneousCost: MiscellaneousDetails[];

  @Prop({ required: true, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus, { message: INVALID_PAYMENT_STATUS })
  paymentStatus: PaymentStatus;

  @Prop({ default: HostelPriceType.FULL_PAYMENT })
  @IsEnum(HostelPriceType, { message: INVALID_TYPE })
  priceType: HostelPriceType;

  @Prop({ default: OrderTypes.AUTOMATION })
  @IsEnum(OrderTypes, { message: INVALID_MODE_TYPE })
  orderType: OrderTypes;

  @Prop({ default: UserType.HOSTEL_ENQUIRY })
  @IsEnum(UserType, { message: INVALID_TYPE })
  purchaseBy: UserType;

  @Prop({ default: OfflinePaymentType.UPI })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  paymentType: OfflinePaymentType;

  @Prop({ default: null })
  chequeOrTransNo: string;

  @Prop({ required: false, default: null })
  @IsEnum(BankDetailsType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  bankDetails: BankDetailsType;

  @Prop({ required: true, type: Number })
  paidAmount: number; //TODO - amount paid by user

  @Prop({ default: null })
  joiningDate: Date;

  @Prop({ default: null })
  nextPaymentDate: Date;

  @Prop({ default: null })
  receiptNumber: string;

  @Prop({ default: true })
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

export const HostelOrderSchema = SchemaFactory.createForClass(HostelOrder);

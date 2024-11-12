import { Document, SchemaTypes, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum, IsString } from 'class-validator';
import {
  PaymentStatus,
  OrderTypes,
  UserType,
  OfflineCoursePriceType,
  OfflinePaymentType,
  HealthCarePurchaseType,
  SchemaReferenceType,
} from 'src/utills/enum';
import {
  INVALID_PAYMENT_STATUS,
  INVALID_MODE_TYPE,
  INVALID_TYPE,
  INVALID_OFFLINE_PAYMENT_TYPE,
} from 'src/utills/messages';
import { Staff } from './staff.schema';
import { HealthcareUser } from './health-care-user.schema';

@Schema({ timestamps: true })
class ProductDetails {
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
    type: Types.ObjectId,
    ref: 'CareService',
  })
  serviceId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  quantity: number;

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

  @Prop({ default: 0 })
  coins: number;
}
@Schema({ timestamps: true })
class DataBaseDetails {
  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'HealthCareTestDatabase',
  })
  testDatabaseId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  quantity: number;

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

  @Prop({ required: true, type: Number, default: 0 })
  coins: number;
}
@Schema({ timestamps: true })
export class HospitalOrder extends Document {
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

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HealthcareUser' })
  userId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'HealthcareUser' })
  parentId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Coupon' })
  couponId: Types.ObjectId;

  @Prop({ default: null, required: false })
  couponAmount: number;

  @Prop({ required: true, default: () => new Date().toISOString() })
  paymentDate: Date;

  @Prop({ required: true, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus, { message: INVALID_PAYMENT_STATUS })
  paymentStatus: PaymentStatus;

  @Prop([{ required: false, type: ProductDetails }])
  productDetails: ProductDetails[];

  @Prop([{ required: false, type: DataBaseDetails }])
  testDatabaseDetails: DataBaseDetails[];

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
  totalAmount: number;

  @Prop({ required: true, type: Number })
  paidAmount: number;

  @Prop({ default: 0, type: Number })
  walletAmount: number;

  @Prop({ default: OfflineCoursePriceType.DISCOUNT_PRICE, required: true })
  @IsEnum(OfflineCoursePriceType, { message: INVALID_TYPE })
  priceType: OfflineCoursePriceType;

  @Prop({ default: OrderTypes.AUTOMATION })
  @IsEnum(OrderTypes, { message: INVALID_MODE_TYPE })
  @IsString()
  orderType: OrderTypes;

  @Prop({ required: true })
  @IsEnum(UserType, { message: INVALID_TYPE })
  purchaseBy: UserType;

  @Prop({ default: OfflinePaymentType.UPI })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  paymentType: OfflinePaymentType;

  @Prop({ default: null })
  nextPaymentDate: Date;

  @Prop({ default: null })
  receiptNumber: string;

  @Prop({ default: HealthCarePurchaseType.CARE_PACKAGE })
  @IsEnum(HealthCarePurchaseType, { message: INVALID_TYPE })
  purchaseProductType: HealthCarePurchaseType;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy: Types.ObjectId | HealthcareUser['_id'] | Staff['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HEALTH_CARE_USER, SchemaReferenceType.STAFF], //TODO: Possible values for createdByModel
  })
  createdByModel:
    | SchemaReferenceType.HEALTH_CARE_USER
    | SchemaReferenceType.STAFF;
  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy: Types.ObjectId | HealthcareUser['_id'] | Staff['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HEALTH_CARE_USER, SchemaReferenceType.STAFF], //TODO: Possible values for updatedByModel
  })
  updatedByModel:
    | SchemaReferenceType.HEALTH_CARE_USER
    | SchemaReferenceType.STAFF;
}

export const HospitalOrderSchema = SchemaFactory.createForClass(HospitalOrder);

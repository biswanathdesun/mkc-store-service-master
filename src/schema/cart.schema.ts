import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum, IsNumber } from 'class-validator';
import {
  INVALID_BOOK_TYPE,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_PRODUCT_TYPE,
} from 'src/utills/messages';
import {
  BookType,
  OfflineCoursePriceType,
  ProductType,
  SchemaReferenceType,
} from 'src/utills/enum';
import { User } from './user.schema';
import { HealthcareUser } from './health-care-user.schema';

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({
    required: true,
    type: SchemaTypes.ObjectId,
    refPath: 'userByModel', //TODO: Dynamic reference based on userByModel
  })
  userId: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HEALTH_CARE_USER, SchemaReferenceType.USER], //TODO: Possible values for userByModel
  })
  userByModel: SchemaReferenceType.HEALTH_CARE_USER | SchemaReferenceType.USER;

  @Prop({ required: true })
  @IsEnum(ProductType, { message: INVALID_PRODUCT_TYPE })
  productType: ProductType;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Book' })
  bookId: Types.ObjectId;

  @Prop({ default: null, required: false })
  @IsEnum(BookType, { message: INVALID_BOOK_TYPE })
  bookType: BookType;

  @Prop({
    default: null,
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'OnlineCourse',
  })
  onlineCourseId: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'TestSeries',
  })
  testId: Types.ObjectId;

  @Prop({
    default: null,
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'CarePackage',
  })
  carePackageId: Types.ObjectId;

  @Prop({
    default: null,
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'CareService',
  })
  careServiceId: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Language',
  })
  languageId: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Price',
  })
  priceId: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Coupon',
  })
  couponId: Types.ObjectId;

  @Prop({ default: null, required: false })
  @IsEnum(OfflineCoursePriceType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  payment_type: OfflineCoursePriceType;

  @Prop({ required: true })
  @IsNumber()
  totalPrice: number;

  @Prop({ required: true })
  @IsNumber()
  gst: number;

  @Prop({ required: true })
  @IsNumber()
  gstAmount: number;

  @Prop({ required: true })
  @IsNumber()
  discountPercentage: number;

  @Prop({ required: true })
  @IsNumber()
  discountedPrice: number;

  @Prop({ required: true })
  @IsNumber()
  quantity: number;

  @Prop({ required: false, default: 0 })
  @IsNumber()
  shippingCharge: number;

  @Prop({ default: 0 })
  @IsNumber()
  prebook_amount: number;

  @Prop({ required: false, default: null, type: Date })
  nextPaymentDate: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HEALTH_CARE_USER, SchemaReferenceType.USER], //TODO: Possible values for createdByModel
  })
  createdByModel:
    | SchemaReferenceType.HEALTH_CARE_USER
    | SchemaReferenceType.USER;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({
    default: null,
    enum: ['HealthcareUser', 'User'], //TODO: Possible values for updatedByModel
  })
  updatedByModel:
    | SchemaReferenceType.HEALTH_CARE_USER
    | SchemaReferenceType.USER;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

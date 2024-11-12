import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  BookType,
  PaymentStatus,
  ModeTypes,
  OfflineCoursePriceType,
  ShippingStatusType,
  OrderTypes,
  UserType,
  FeeTypes,
} from 'src/utills/enum';
import {
  INVALID_BOOK_TYPE,
  INVALID_PAYMENT_STATUS,
  INVALID_MODE_TYPE,
  INVALID_SHPPING_STATUS,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_TYPE,
} from 'src/utills/messages';
import { OnlineCourse } from './online-course.schema';
import { Book } from './book.schema';
import { TestSeries } from './test-series.schema';
import { Staff } from './staff.schema';
import { Event } from './event.schema';
import { User } from './user.schema';

@Schema({ timestamps: true })
class CourseData {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'OnlineCourse' })
  @IsNotEmpty()
  onlineCourseId: OnlineCourse['_id'];

  @Prop()
  @IsOptional()
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  type: ModeTypes;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Language' })
  @IsOptional()
  languageId: Types.ObjectId;

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
  @IsOptional()
  @IsNumber()
  shippingCharge: number;

  @Prop({ default: 0 })
  @IsNumber()
  @IsNotEmpty()
  coins: number;

  @Prop({ default: null })
  @IsEnum(OfflineCoursePriceType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  paymnetStatus: OfflineCoursePriceType;
}
@Schema({ timestamps: true })
class BookData {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Book' })
  @IsNotEmpty()
  bookId: Book['_id'];

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Language' })
  @IsOptional()
  languageId: Types.ObjectId;

  @Prop()
  @IsOptional()
  @IsEnum(BookType, { message: INVALID_BOOK_TYPE })
  @IsString()
  bookType: BookType;

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
  @IsOptional()
  @IsNumber()
  shippingCharge: number;

  @Prop({ default: null })
  @IsEnum(ShippingStatusType, { message: INVALID_SHPPING_STATUS })
  shippingStatus: ShippingStatusType;

  @Prop({ default: 0 })
  @IsNumber()
  @IsNotEmpty()
  coins: number;
}
@Schema({ timestamps: true })
class TestSeriesData {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'TestSeries' })
  @IsNotEmpty()
  testId: TestSeries['_id'];

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Language' })
  @IsOptional()
  languageId: Types.ObjectId;

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
  @IsOptional()
  @IsNumber()
  shippingCharge: number;

  @Prop({ default: 0 })
  @IsNumber()
  @IsNotEmpty()
  coins: number;
}
@Schema({ timestamps: true })
class EventData {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Event' })
  @IsNotEmpty()
  eventId: Event['_id'];

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
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ default: null })
  mkcOrderId: string;

  @Prop({ default: null })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, default: null })
  parentOrderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  parentId: Types.ObjectId;

  @Prop({ default: null, type: Types.ObjectId, ref: 'UserDeliveryAddress' })
  addressId: Types.ObjectId;

  @Prop({ required: true, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus, { message: INVALID_PAYMENT_STATUS })
  paymentStatus: PaymentStatus;

  @Prop([{ default: null, type: CourseData }])
  @IsOptional()
  onlineCourseDetails: CourseData[];

  @Prop([{ default: null, type: BookData }])
  @IsOptional()
  bookDetails: BookData[];

  @Prop([{ default: null, type: TestSeriesData }])
  @IsOptional()
  testSeriesDetails: TestSeriesData[];

  @Prop([{ default: null, type: EventData }])
  @IsOptional()
  eventDetails: EventData;

  @Prop({ required: true, default: Date.now })
  paymentDate: Date;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Coupon' })
  couponId: Types.ObjectId;

  @Prop({ default: null })
  @IsOptional()
  @IsNumber()
  couponAmount: number;

  @Prop({ default: 0 })
  @IsNumber()
  manualDiscountAmount: number;

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
  shippingCharge: number;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  paidAmount: number;

  @Prop({ default: 0 })
  @IsNotEmpty()
  @IsNumber()
  walletAmount: number;

  @Prop({ default: null })
  @IsOptional()
  @IsEnum(OfflineCoursePriceType, { message: INVALID_PAYMENT_STATUS })
  priceType: OfflineCoursePriceType;

  @Prop({ default: OrderTypes.AUTOMATION })
  @IsEnum(OrderTypes, { message: INVALID_MODE_TYPE })
  orderType: OrderTypes;

  @Prop({ default: UserType.STUDENT })
  @IsEnum(UserType, { message: INVALID_TYPE })
  purchaseBy: UserType;

  @Prop({ default: false })
  isGivenDiscount: boolean;

  @Prop({ default: FeeTypes.PRODUCT_PURCHASE })
  @IsEnum(FeeTypes, { message: INVALID_TYPE })
  feeType: FeeTypes;

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

export const OrderSchema = SchemaFactory.createForClass(Order);

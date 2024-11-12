import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CouponType, CouponProductType } from 'src/utills/enum';
import { Staff } from './staff.schema';
import { INVALID_PRODUCT_TYPE, INVALID_COUPON_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class Coupon extends Document {
  @Prop()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop()
  @IsNotEmpty()
  @IsString()
  code: string;

  @Prop()
  @IsNotEmpty()
  @IsEnum(CouponType, { message: INVALID_COUPON_TYPE })
  couponType: CouponType;

  @Prop()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @Prop()
  @IsNumber()
  @IsNotEmpty()
  numberOfIssued: number;

  @Prop({ default: 0 })
  @IsNumber()
  appliedCoupon: number;

  @Prop({ default: 0 })
  @IsNumber()
  availableCoupon: number;

  @Prop()
  @IsNumber()
  @IsNotEmpty()
  minimumOrderPrice: number;

  @Prop({ default: null })
  @IsOptional()
  @IsNumber()
  maxDiscount: number;

  @Prop({ required: true, type: Date })
  @IsNotEmpty()
  @IsDateString()
  expiryDate: Date;

  @Prop({ default: null })
  @IsNotEmpty()
  @IsEnum(CouponProductType, { message: INVALID_PRODUCT_TYPE })
  validFor: CouponProductType[];

  @Prop({ default: false })
  isApplied: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Staff['_id'];

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  updatedBy: Staff['_id'];
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

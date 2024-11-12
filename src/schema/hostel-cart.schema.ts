import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import { INVALID_BED_TYPE, INVALID_PAYMENT_STATUS } from 'src/utills/messages';
import { BedTypes, HostelPaymentType } from 'src/utills/enum';

@Schema({ timestamps: true })
export class HostelCart extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HostelEnquiry' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Hostel' })
  hostelId: Types.ObjectId;

  @Prop({ required: true, default: HostelPaymentType.MONTH_WISE })
  @IsEnum(HostelPaymentType, { message: INVALID_PAYMENT_STATUS })
  type: HostelPaymentType;

  @Prop({ default: null, type: Number })
  roomNumber: number;

  @Prop({ default: null, type: Number })
  floorNumber: number;

  @Prop({ required: true })
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  bedType: BedTypes;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Coupon' })
  couponId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  joiningDate: Date;

  @Prop({ required: true, type: Number })
  count: number; //TODO - if monthly then , how many month & if day wise, how many days

  @Prop({ required: false, type: Number, default: 0 })
  securityAmount: number;

  @Prop({ required: true, type: Number })
  totalGst: number;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HostelEnquiry' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HostelEnquiry' })
  updatedBy: Types.ObjectId;
}

export const HostelCartSchema = SchemaFactory.createForClass(HostelCart);

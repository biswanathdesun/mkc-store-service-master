import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import {
  BedTypes,
  HostelPaymentType,
  SchemaReferenceType,
} from 'src/utills/enum';
import { INVALID_BED_TYPE, INVALID_TYPE } from 'src/utills/messages';
import { HostelEnquiry } from './hostel-enquiry.schema';
import { Staff } from './staff.schema';

@Schema({ timestamps: true })
export class UserHostelValidity extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'HostelEnquiry' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Hostel' })
  hostelId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'HostelOrder' })
  orderId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'HostelRentalPay' })
  paymentId: Types.ObjectId;

  @Prop({ required: true, default: HostelPaymentType.MONTH_WISE })
  @IsEnum(HostelPaymentType, { message: INVALID_TYPE })
  type: HostelPaymentType;

  @Prop({ required: false, type: Number })
  totalDays: number;

  @Prop({ required: true })
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  bedType: BedTypes;

  @Prop({ required: false, type: Number })
  roomNumber: number;

  @Prop({ required: false, type: Number })
  floorNumber: number;

  @Prop({ required: true })
  joiningDate: Date;

  @Prop({ required: true })
  validityStartDate: Date;

  @Prop({ required: true })
  validityEndDate: Date;

  @Prop({ default: false })
  isSecurityFeeAdded: boolean;

  @Prop({ default: false })
  isSecurityFeeFullPaid: boolean;

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

export const UserHostelValiditySchema =
  SchemaFactory.createForClass(UserHostelValidity);

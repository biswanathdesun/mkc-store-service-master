import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsDateString, IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  EnquiryStatus,
  Gender,
  HostelPaymentType,
  LeadSourceType,
  SchemaReferenceType,
  UserType,
} from 'src/utills/enum';
import { Staff } from './staff.schema';
import {
  INVALID_GENDER,
  INVALID_PAYMENT_STATUS,
  INVALID_TYPE,
  INVALID_USER_TYPE,
} from 'src/utills/messages';

class State {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  stateId: number;

  @Prop({ required: true })
  iso2: string;
}

class City {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  cityId: number;
}

@Schema({ timestamps: true })
export class HostelEnquiry extends Document {
  @Prop({ required: false })
  uniqueId: string;

  @Prop({ required: false, default: null })
  @IsEnum(HostelPaymentType, { message: INVALID_PAYMENT_STATUS })
  hostelPaymentType: HostelPaymentType;

  @Prop({ required: false, type: SchemaTypes.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: false })
  address: string;

  @Prop({ required: false, default: null })
  parentName: string;

  @Prop({ required: false, default: null })
  parentNumber: string;

  @Prop({ required: false, default: null })
  @IsEnum(Gender, { message: INVALID_GENDER })
  gender: Gender;

  @Prop({ default: null })
  referralCode: string;

  @Prop({ default: null })
  recommandReferralCode: string;

  @Prop({ default: 100 })
  coins: number;

  @Prop({ default: null })
  enrollmentNumber: string;

  @Prop({ required: false, type: State, default: null })
  state: State;

  @Prop({ default: null })
  city: City;

  @Prop({ required: false })
  @IsDateString()
  joiningDate: Date;

  @Prop({ default: EnquiryStatus.NEW })
  enquiryStatus: EnquiryStatus;

  @Prop({ default: null })
  oneSignalWebId: string;

  @Prop({ default: null })
  oneSignalAndoridId: string;

  @Prop({ default: null })
  oneSignalIosId: string;

  @Prop({ default: false })
  isMkcStudent: boolean;

  @Prop({ default: false })
  isOldStudent: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Staff',
  })
  primaryCounsellorId: Types.ObjectId;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'Staff',
  })
  secondaryCounsellorId: Types.ObjectId;

  @Prop({ default: UserType.HOSTEL_ENQUIRY })
  @IsEnum(UserType, { message: INVALID_USER_TYPE })
  type: UserType;

  @Prop({ default: null })
  @IsEnum(LeadSourceType, { message: INVALID_TYPE })
  leadSource: LeadSourceType;

  @Prop({ default: null, type: Date })
  @IsDate()
  lastLogin: Date;

  @Prop({ default: null, required: false })
  preparationType: string;

  @Prop({ default: null, type: Date })
  @IsDate()
  refundProcessingDate: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy: Types.ObjectId | HostelEnquiry['_id'] | Staff['_id'] | null;

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HOSTEL_USER, SchemaReferenceType.STAFF, null], //TODO: Possible values for createdByModel
  })
  createdByModel:
    | SchemaReferenceType.HOSTEL_USER
    | SchemaReferenceType.STAFF
    | null;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy: Types.ObjectId | HostelEnquiry['_id'] | Staff['_id'] | null;

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HOSTEL_USER, SchemaReferenceType.STAFF, null], //TODO: Possible values for updatedByModel
  })
  updatedByModel:
    | SchemaReferenceType.HOSTEL_USER
    | SchemaReferenceType.STAFF
    | null;
}
export const HostelEnquirySchema = SchemaFactory.createForClass(HostelEnquiry);

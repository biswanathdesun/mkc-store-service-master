import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDateString, IsEnum, IsEmail, IsDate } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  EnquiryStatus,
  Gender,
  LeadEligibility,
  LeadSourceType,
  UserStatusTypes,
  UserType,
} from 'src/utills/enum';
import { Staff } from './staff.schema';
import {
  INVALID_GENDER,
  INVALID_STUDENT_STATUS,
  INVALID_TYPE,
  INVALID_USER_TYPE,
} from 'src/utills/messages';

class State {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  stateId: string;

  @Prop({ required: true })
  iso2: string;
}

class City {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  cityId: string;
}

@Schema({ timestamps: true })
export class HealthcareUser extends Document {
  @Prop({ required: true, unique: true })
  uniqueId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false, default: null })
  image: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ default: null, required: false })
  whatsappNumber: string;

  @Prop({ required: false, default: null })
  @IsEmail()
  email: string;

  @Prop({ default: null })
  @IsEnum(Gender, { message: INVALID_GENDER })
  gender: Gender;

  @Prop({ default: null })
  referralCode: string;

  @Prop({ default: null })
  recommandReferralCode: string;

  @Prop({ required: false, type: State, default: null })
  state: State;

  @Prop({ default: null })
  city: City;

  @Prop({ default: null })
  address: string;

  @Prop({ default: null })
  pincode: string;

  @Prop({ default: null })
  parentCode: string;

  @Prop({ default: null })
  parentName: string;

  @Prop({ default: null })
  parentNumber: string;

  @Prop({ required: false, default: null })
  query: string;

  @Prop({ required: false, default: null })
  @IsDateString()
  appointmentDate: Date;

  @Prop({ required: false, default: null })
  @IsDateString()
  dob: Date;

  @Prop({ default: EnquiryStatus.NEW })
  enquiryStatus: EnquiryStatus;

  @Prop({ default: null })
  @IsEnum(LeadEligibility, { message: INVALID_TYPE })
  leadEligibility: LeadEligibility;

  @Prop({ default: null })
  leadRemarks: string;

  @Prop({ default: null })
  @IsEnum(LeadSourceType, { message: INVALID_TYPE })
  leadSource: LeadSourceType;

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

  @Prop({ default: 100 })
  coins: number;

  @Prop({ default: null })
  oneSignalWebId: string;

  @Prop({ default: null })
  oneSignalAndoridId: string;

  @Prop({ default: null })
  oneSignalIosId: string;

  @Prop({ default: UserType.HOSPITAL_ENQUIRY })
  @IsEnum(UserType, { message: INVALID_USER_TYPE })
  type: UserType;

  @Prop({ default: UserStatusTypes.APPLIED })
  @IsEnum(UserStatusTypes, { message: INVALID_STUDENT_STATUS })
  patientStatus: UserStatusTypes;

  @Prop({ default: null, type: Date })
  tokenGeneratedDate: Date;

  @Prop({ default: null, type: Date })
  @IsDate()
  lastLogin: Date;

  @Prop({ default: false })
  isRegistered: boolean;

  @Prop({ default: null, type: Date })
  registationDate: Date;

  @Prop({ default: false })
  isFollowUpCreated: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: [
      { type: SchemaTypes.ObjectId, ref: 'Staff' },
      { type: SchemaTypes.ObjectId, ref: 'HealthcareUser' },
    ],
  })
  createdBy: Types.ObjectId | Staff['_id'] | HealthcareUser['_id'];

  @Prop({
    default: null,
    type: [
      { type: SchemaTypes.ObjectId, ref: 'Staff' },
      { type: SchemaTypes.ObjectId, ref: 'HealthcareUser' },
    ],
  })
  updatedBy: Types.ObjectId | Staff['_id'] | HealthcareUser['_id'];
}

export const HealthcareUserSchema =
  SchemaFactory.createForClass(HealthcareUser);

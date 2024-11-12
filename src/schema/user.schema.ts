import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEmail, IsEnum, IsDate } from 'class-validator';
import { Category } from './category.schema';
import { Course } from './course.schema';
import {
  Gender,
  LeadEligibility,
  LeadSourceType,
  StudentSignUpType,
  UserStatusTypes,
  UserType,
} from 'src/utills/enum';
import {
  INVALID_GENDER,
  INVALID_MODE,
  INVALID_STUDENT_STATUS,
  INVALID_TYPE,
  INVALID_USER_TYPE,
} from 'src/utills/messages';

class State {
  @Prop({ required: true, type: String })
  stateId: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  iso2: string;
}

class City {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  cityId: string;
}
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  uniqueId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  @IsEmail()
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ default: null, required: false })
  whatsappNumber: string;

  @Prop({ default: null })
  image: string;

  @Prop({ default: null })
  identityCard: string;

  @Prop({ default: null })
  signature: string;

  @Prop({ default: null })
  marksheet: string;

  @Prop({ default: null })
  motherPicture: string;

  @Prop({ default: null })
  fatherPicture: string;

  @Prop({ default: null })
  parentIdProve: string;

  @Prop({ default: null })
  @IsEnum(Gender, { message: INVALID_GENDER })
  gender: Gender;

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

  @Prop({ default: null })
  motherMobile: number;

  @Prop({ default: null })
  referralCode: string;

  @Prop({ default: null })
  recommandReferralCode: string;

  @Prop({
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'School',
    default: null,
  })
  schoolId: Types.ObjectId;

  @Prop({ required: false, default: null })
  class: number;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Category' })
  categoryId: Category['_id'];

  @Prop({ default: null, type: Types.ObjectId, ref: 'Course' })
  courseId: Course['_id'];

  @Prop({ type: Types.ObjectId, default: null, ref: 'User' })
  parentId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId }], default: null, ref: 'User' })
  studentIds: Types.ObjectId[];

  @Prop({ default: null })
  state: State;

  @Prop({ default: null })
  city: City;

  @Prop({ default: null, type: Date })
  @IsDate()
  lastLogin: Date;

  @Prop({ default: false })
  isRegistered: boolean;

  @Prop({ default: null, type: Date })
  registationDate: Date;

  @Prop({ default: false })
  isPurchesed: boolean;

  @Prop({ default: null, type: Date })
  @IsDate()
  tokenGeneratedDate: Date;

  @Prop({ required: false })
  @IsEnum(StudentSignUpType, { message: INVALID_MODE })
  mode: StudentSignUpType;

  @Prop({ default: UserStatusTypes.APPLIED })
  @IsEnum(UserStatusTypes, { message: INVALID_STUDENT_STATUS })
  studentStatus: UserStatusTypes;

  @Prop({ default: false })
  isDroppedStatus: boolean;

  @Prop({ default: false })
  isBookSold: boolean;

  @Prop({ default: false })
  isTestSeriesSold: boolean;

  @Prop({ default: false })
  isOnlineCourseSold: boolean;

  @Prop({ default: false })
  isOfflineCourseSold: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  primaryCounsellorId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  secondaryCounsellorId: Types.ObjectId;

  @Prop({ default: 100, type: Number })
  coins: number;

  @Prop({ default: null })
  oneSignalWebId: string;

  @Prop({ default: null })
  oneSignalAndoridId: string;

  @Prop({ default: null })
  oneSignalIosId: string;

  @Prop({ default: null })
  message: string;

  @Prop({ required: true })
  @IsEnum(UserType, { message: INVALID_USER_TYPE })
  type: UserType;

  @Prop({ default: null })
  @IsEnum(LeadEligibility, { message: INVALID_TYPE })
  leadEligibility: LeadEligibility;

  @Prop({ required: true })
  @IsEnum(LeadSourceType, { message: INVALID_TYPE })
  leadSource: LeadSourceType;

  @Prop({ default: null })
  leadRemarks: string;

  @Prop({ default: false })
  isFollowUpCreated: boolean;

  @Prop({ default: false })
  isMovedStudent: boolean;

  @Prop({ default: false })
  isSaleEnquiry: boolean;

  @Prop({ default: false })
  isMkcStudent: boolean;

  @Prop({ default: null, type: Date })
  salesEnquiryDate: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null })
  createdBy: string;

  @Prop({ default: null })
  updatedBy: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ phone: 1 }, { unique: true });

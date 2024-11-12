import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import {
  FollowUpSiteSource,
  FollowUpSource,
  FollowUpStatus,
  FollowUpTypes,
} from 'src/utills/enum';
import {
  INVALID_FOLLOWUP_STATUS,
  INVALID_FOLLOW_UP_TYPE,
} from 'src/utills/messages';

@Schema({ timestamps: true })
export class FollowUp extends Document {
  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'HealthcareUser' })
  patientId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  primaryCounsellorId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  secondaryCounsellorId: Types.ObjectId;

  @Prop({ required: true })
  @IsEnum(FollowUpTypes, { message: INVALID_FOLLOW_UP_TYPE })
  type: FollowUpTypes;

  @Prop({ default: FollowUpSource.OTHER })
  @IsEnum(FollowUpSource, { message: INVALID_FOLLOW_UP_TYPE })
  followUpSource: FollowUpSource;

  @Prop({ type: Date, default: null })
  admissionDate: Date;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'OnlineCourse' })
  onlineCourseId: Types.ObjectId;

  @Prop({ default: new Date(), type: Date })
  followUpDate: Date;

  @Prop({ default: null, type: Date })
  nextFollowUpDate: Date;

  @Prop({ required: true })
  followUpResponse: string;

  @Prop({ default: FollowUpStatus.PENDING })
  @IsEnum(FollowUpStatus, { message: INVALID_FOLLOWUP_STATUS })
  followupStatus: FollowUpStatus;

  @Prop({ required: true })
  @IsEnum(FollowUpSiteSource, { message: INVALID_FOLLOWUP_STATUS })
  siteSource: FollowUpSiteSource;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updateddBy: Types.ObjectId;
}

export const FollowUpSchema = SchemaFactory.createForClass(FollowUp);

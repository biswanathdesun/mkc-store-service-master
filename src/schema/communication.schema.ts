import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { User } from './user.schema';
import { HealthcareUser } from './health-care-user.schema';
import { IsEnum } from 'class-validator';
import {
  NotificationSendType,
  NotificationTypes,
  SchemaReferenceType,
} from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';
import { Staff } from './staff.schema';

@Schema({ timestamps: true })
export class Communication extends Document {
  @Prop({
    required: false,
    type: SchemaTypes.ObjectId,
    refPath: 'userModel', //TODO: Dynamic reference based on userModel
  })
  userId: Types.ObjectId | User['_id'] | HealthcareUser['_id'] | Staff['_id'];

  @Prop({
    required: false,
    enum: [
      SchemaReferenceType.USER,
      SchemaReferenceType.HEALTH_CARE_USER,
      SchemaReferenceType.STAFF,
    ], //TODO: Possible values for userModel
  })
  userModel:
    | SchemaReferenceType.USER
    | SchemaReferenceType.HEALTH_CARE_USER
    | SchemaReferenceType.STAFF;

  @Prop({ required: false })
  mobile: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: true })
  @IsEnum(NotificationTypes, { message: INVALID_TYPE })
  notificationType: NotificationTypes;

  @Prop({ required: true })
  @IsEnum(NotificationSendType, { message: INVALID_TYPE })
  sendTo: NotificationSendType;

  @Prop({ required: true })
  message: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    required: false,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy:
    | Types.ObjectId
    | User['_id']
    | Staff['_id']
    | HealthcareUser['_id'];

  @Prop({
    required: false,
    enum: [
      SchemaReferenceType.USER,
      SchemaReferenceType.STAFF,
      SchemaReferenceType.HEALTH_CARE_USER,
    ], //TODO: Possible values for createdByModel
  })
  createdByModel:
    | SchemaReferenceType.USER
    | SchemaReferenceType.STAFF
    | SchemaReferenceType.HEALTH_CARE_USER;

  @Prop({
    required: false,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy:
    | Types.ObjectId
    | User['_id']
    | Staff['_id']
    | HealthcareUser['_id'];

  @Prop({
    required: false,
    enum: [
      SchemaReferenceType.USER,
      SchemaReferenceType.STAFF,
      SchemaReferenceType.HEALTH_CARE_USER,
    ], //TODO: Possible values for updatedByModel
  })
  updatedByModel:
    | SchemaReferenceType.USER
    | SchemaReferenceType.STAFF
    | SchemaReferenceType.HEALTH_CARE_USER;
}

export const CommunicationSchema = SchemaFactory.createForClass(Communication);

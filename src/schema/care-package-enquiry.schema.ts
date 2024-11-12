import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDateString, IsEnum } from 'class-validator';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { CarePackage } from './care-package.schema';
import { EnquiryStatus, LeadSourceType } from 'src/utills/enum';
import { Staff } from './staff.schema';
import { INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class CarePackageEnquiry extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: true })
  query: string;

  @Prop({ required: true })
  @IsDateString()
  appointmentDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'CarePackage', default: null })
  carePackageId: CarePackage['_id'];

  @Prop({ default: EnquiryStatus.NEW })
  enquiryStatus: EnquiryStatus;

  @Prop({ default: null })
  @IsEnum(LeadSourceType, { message: INVALID_TYPE })
  leadSource: LeadSourceType;

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

export const CarePackageEnquirySchema =
  SchemaFactory.createForClass(CarePackageEnquiry);

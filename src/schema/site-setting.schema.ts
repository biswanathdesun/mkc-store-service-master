import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Setting extends Document {
  @Prop({ default: null, type: Number })
  phone: number;

  @Prop({ default: null, type: Number })
  fineInquiryPhone: number;

  @Prop({ default: null, type: String })
  instruction: string;

  @Prop({ default: null, type: String })
  gstNumber: string;

  @Prop({ default: null, type: String })
  instituteName: string;

  @Prop({ default: null, type: String })
  instituteAddress: string;

  @Prop({ default: null, type: String })
  instituteImage: string;

  @Prop({ default: null, type: String })
  liveStreamIp: string;

  @Prop({ default: null, type: String })
  seminarSampleFile: string;

  @Prop({ default: null, type: String })
  logoLink: string;

  @Prop({ default: null, type: String })
  admitCardLogoLink: string;

  @Prop({ default: null, type: String })
  hospitalLogoLink: string;

  @Prop({ default: null, type: String })
  hostelLogoLink: string;

  @Prop({ default: null, type: String })
  androidVersionName: string;

  @Prop({ default: null, type: String })
  iosVersionName: string;

  @Prop({ default: null, type: String })
  androidVersionCode: string;

  @Prop({ default: null, type: String })
  iosVersionCode: string;

  @Prop({ default: null, type: Number })
  hostelEnquiryNumber: number;

  @Prop({ default: false })
  isAndroidUpdation: boolean;

  @Prop({ default: false })
  isIosUpdation: boolean;

  @Prop({ default: 0, type: Number })
  inventoryRatePerKm: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

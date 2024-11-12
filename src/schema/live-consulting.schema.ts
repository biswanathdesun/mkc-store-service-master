import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { LiveClassStatus, LiveClassType } from 'src/utills/enum';

@Schema({ timestamps: true })
export class LiveConsulting extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'HealthcareUser' })
  patientId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'HospitalOrder' })
  orderId: Types.ObjectId;

  @Prop({
    required: true,
    type: SchemaTypes.ObjectId,
    ref: 'HealthCareFinance',
  })
  paymentId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Staff' })
  doctorId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Number })
  duration: number;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({ type: Number, required: true })
  meetingNumber: number;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ required: true, default: LiveClassType.ZOOM_CLASS })
  liveConsultingType: LiveClassType;

  @Prop({ required: true, default: LiveClassStatus.UPCOMING })
  liveConsultingStatus: LiveClassStatus;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const LiveConsultingSchema =
  SchemaFactory.createForClass(LiveConsulting);

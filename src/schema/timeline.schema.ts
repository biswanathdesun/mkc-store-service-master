import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true })
export class Timeline extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'HealthcareUser', default: null })
  patientId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'HostelEnquiry', default: null })
  hostelUserId: Types.ObjectId;

  @Prop()
  section: string;

  @Prop()
  reason: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Telecommunications',
    default: null,
  })
  communicationId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'OfflineCoursePayment',
    default: null,
  })
  paymentId: Types.ObjectId;

  @Prop({
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'OnlineCourse',
    default: null,
  })
  courseId: Types.ObjectId;

  @Prop({
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'UserHostelValidity',
    default: null,
  })
  userHostelValidityId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const TimelineSchema = SchemaFactory.createForClass(Timeline);

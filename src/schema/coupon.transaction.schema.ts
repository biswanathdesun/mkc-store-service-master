import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { User } from './user.schema';
import { HealthcareUser } from './health-care-user.schema';

@Schema({ timestamps: true })
export class CouponTransaction extends Document {
  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'User',
  })
  userId: Types.ObjectId;

  @Prop({
    default: null,
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'HealthcareUser',
  })
  healthcareUserId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Coupon' })
  couponId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Order',
    default: null,
    required: false,
  })
  orderId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'HospitalOrder',
    default: null,
    required: false,
  })
  healthcareOrderId: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: [
      { type: SchemaTypes.ObjectId, ref: 'User' },
      { type: SchemaTypes.ObjectId, ref: 'HealthcareUser' },
    ],
  })
  createdBy: Types.ObjectId | User['_id'] | HealthcareUser['_id'];

  @Prop({
    default: null,
    type: [
      { type: SchemaTypes.ObjectId, ref: 'User' },
      { type: SchemaTypes.ObjectId, ref: 'HealthcareUser' },
    ],
  })
  updatedBy: Types.ObjectId | User['_id'] | HealthcareUser['_id'];
}

export const CouponTransactionSchema =
  SchemaFactory.createForClass(CouponTransaction);

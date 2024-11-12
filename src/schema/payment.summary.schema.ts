import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { User } from './user.schema';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { HealthcareUser } from './health-care-user.schema';

@Schema({ timestamps: true })
export class PaymentSummary extends Document {
  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'userByModel',
  })
  userId: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({ default: null, enum: ['HealthcareUser', 'User'] })
  userByModel: 'HealthcareUser' | 'User';

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  gst: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  gstAmount: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  shippingCharge: number;

  @Prop()
  @IsOptional()
  @IsNumber()
  discountedPrice: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @Prop()
  @IsNotEmpty()
  @IsNumber()
  amountToBePaid: number;

  @Prop()
  @IsOptional()
  @IsNumber()
  walletAmount: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({
    default: null,
    enum: ['HealthcareUser', 'User'], //TODO: Possible values for createdByModel
  })
  createdByModel: 'HealthcareUser' | 'User';

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({
    default: null,
    enum: ['HealthcareUser', 'User'], //TODO: Possible values for updatedByModel
  })
  updatedByModel: 'HealthcareUser' | 'User';
}

export const PaymentSummarySchema =
  SchemaFactory.createForClass(PaymentSummary);

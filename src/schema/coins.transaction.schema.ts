import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { User } from './user.schema';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { CoinTransactionReasonTypes } from 'src/utills/enum';
import { INVALID_COIN_TRANSACTION_STATUS } from 'src/utills/messages';

@Schema({ timestamps: true })
export class CoinsTransaction extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'HealthcareUser', default: null })
  patientId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'HostelEnquiry', default: null })
  hostelUserId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', default: null })
  orderId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'HospitalOrder', default: null })
  healthcareOrderId: Types.ObjectId;

  @Prop({ default: 0 })
  @IsNotEmpty()
  @IsNumber()
  credit: number;

  @Prop({ default: 0 })
  @IsNotEmpty()
  @IsNumber()
  debit: number;

  @Prop({ required: true, default: null })
  @IsEnum(CoinTransactionReasonTypes, {
    message: INVALID_COIN_TRANSACTION_STATUS,
  })
  transactionReason: CoinTransactionReasonTypes;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  referredUserId: Types.ObjectId; //TODO: The user who used the referral code

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  referringUserId: Types.ObjectId; //TODO: The user who referred code

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'HealthcareUser' })
  referredPatientId: Types.ObjectId; //TODO: The user who used the referral code

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'HealthcareUser' })
  referringPatientId: Types.ObjectId; //TODO: The user who referred code

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'HostelEnquiry' })
  referredHostelUserId: Types.ObjectId; //TODO: The user who used the referral code

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'HostelEnquiry' })
  referringHostelUserId: Types.ObjectId; //TODO: The user who referred code

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  createdBy: User['_id'];

  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  updatedBy: User['_id'];
}

export const CoinsTransactionSchema =
  SchemaFactory.createForClass(CoinsTransaction);

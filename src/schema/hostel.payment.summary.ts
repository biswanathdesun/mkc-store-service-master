import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsNumber } from 'class-validator';

@Schema({ timestamps: true })
export class HostelPaymentSummary extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HostelEnquiry' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  @IsNumber()
  totalPrice: number;

  @Prop({ required: true, type: Number })
  @IsNumber()
  gstAmount: number;

  @Prop({ required: false, type: Number, default: 0 })
  @IsNumber()
  securityAmount: number;

  @Prop({ required: true, type: Number })
  @IsNumber()
  totalAmount: number;

  @Prop({ required: true, type: Number })
  @IsNumber()
  amountToBePaid: number;

  @Prop({ required: false, default: 0, type: Number })
  @IsNumber()
  walletAmount: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HostelEnquiry' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: false, ref: 'HostelEnquiry' })
  updatedBy: Types.ObjectId;
}

export const HostelPaymentSummarySchema =
  SchemaFactory.createForClass(HostelPaymentSummary);

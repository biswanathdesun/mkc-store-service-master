import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProductTracking extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({
    required: true,
    type: [{ type: Types.ObjectId, ref: 'Book' }],
  })
  @IsNotEmpty()
  bookIds: Types.ObjectId[];

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  trackingId: string;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  trackingUrl: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const ProductTrackingSchema =
  SchemaFactory.createForClass(ProductTracking);

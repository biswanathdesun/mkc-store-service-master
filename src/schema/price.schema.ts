import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Price extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  mrpPrice: number;

  @Prop({ required: true })
  discountedPrice: number;

  @Prop({ required: true })
  discountPercentage: number;

  @Prop({ required: true })
  gst: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const PriceSchema = SchemaFactory.createForClass(Price);

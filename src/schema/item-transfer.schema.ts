import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNumber } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ItemTransfer extends Document {
  @Prop({ default: null, type: Types.ObjectId, ref: 'StockEntry' })
  stockId: Types.ObjectId;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Warehouse' })
  transferTo: Types.ObjectId;

  @Prop({ required: true })
  @IsNumber()
  quantity: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}
export const ItemTransferSchema = SchemaFactory.createForClass(ItemTransfer);

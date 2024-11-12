import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class InventoryItemTransaction extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Warehouse' })
  wareHouseId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  studentId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'InventoryItem', default: null })
  itemId: Types.ObjectId;

  @Prop({ required: true, type: Number, default: 0 })
  openingStock: number;

  @Prop({ required: true, type: Number, default: 0 })
  stockRate: number;

  @Prop({ required: false, type: Number, default: 0 })
  credit: number;

  @Prop({ required: false, type: Number, default: 0 })
  debit: number;

  @Prop({ required: true, type: Number, default: 0 })
  currentBalance: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const InventoryItemTransactionSchema = SchemaFactory.createForClass(
  InventoryItemTransaction,
);

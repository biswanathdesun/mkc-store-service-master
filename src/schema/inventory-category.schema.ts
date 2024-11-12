import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
@Schema({ timestamps: true })
export class InventoryCategory {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const InventoryCategorySchema =
  SchemaFactory.createForClass(InventoryCategory);

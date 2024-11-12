import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { InventoryItemType } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
class ItemDetails {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'InventoryItem' })
  itemId: Types.ObjectId;

  @Prop({ default: false })
  isWareHouseAdded: boolean;

  @Prop({ default: true })
  status: boolean;
}

@Schema({ timestamps: true })
export class InventoryItemGroup extends Document {
  @Prop({ required: true, default: InventoryItemType.GOODS })
  @IsEnum(InventoryItemType, { message: INVALID_TYPE })
  type: InventoryItemType;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'InventoryUnits', default: null })
  unitId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'InventoryCategory', default: null })
  categoryId: Types.ObjectId;

  @Prop([{ required: false, type: ItemDetails }])
  items: ItemDetails[];

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const InventoryItemGroupSchema =
  SchemaFactory.createForClass(InventoryItemGroup);

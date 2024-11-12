import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { InventoryItemType } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
class ValuesDetails {
  @Prop({ required: true, type: String })
  name: string;
}

@Schema({ timestamps: true })
class AttributeDetails {
  @Prop({
    required: true,
    type: SchemaTypes.ObjectId,
    ref: 'InventoryAttributes',
  })
  attributeId: Types.ObjectId;

  @Prop([{ required: true, type: ValuesDetails }])
  values: ValuesDetails[];

  @Prop({ default: true })
  status: boolean;
}

@Schema({ timestamps: true })
class WarehousesDetails {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Warehouse' })
  wareHouseId: Types.ObjectId;

  @Prop({ required: true, type: Number, default: 0 })
  initialStock: number;

  @Prop({ required: true, type: Number, default: 0 })
  stockRate: number;

  @Prop({ required: true, type: Number, default: 0 })
  reorderPoint: number;

  @Prop({ default: true })
  status: boolean;
}

@Schema({ timestamps: true })
export class InventoryItem extends Document {
  @Prop({ required: true, default: InventoryItemType.GOODS })
  @IsEnum(InventoryItemType, { message: INVALID_TYPE })
  type: InventoryItemType;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  sku: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'InventoryUnits', default: null })
  unitId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'InventoryCategory', default: null })
  categoryId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Book', default: null })
  bookId: Types.ObjectId;

  @Prop({ required: true, type: String })
  isbn: string;

  @Prop({ required: true, type: Number, default: 0 })
  sellingPrice: number;

  @Prop({ required: true, type: Number, default: 0 })
  costPrice: number;

  @Prop([{ required: false, type: WarehousesDetails }])
  warehouses: WarehousesDetails[];

  @Prop([{ required: false, type: AttributeDetails, default: null }])
  attributes: AttributeDetails[];

  @Prop({
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'InventoryItemGroup',
    default: null,
  })
  itemGroupId: Types.ObjectId;

  @Prop({ default: false })
  isGroupedItem: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);

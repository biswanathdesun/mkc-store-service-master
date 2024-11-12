import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import { Units } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class ProductCatalog {
  @Prop({ required: true })
  title: string;

  @Prop()
  @IsEnum(Units, { message: INVALID_TYPE })
  @IsString()
  @IsNotEmpty()
  unit: Units;

  @Prop({ type: Types.ObjectId, default: null, ref: 'InventoryCategory' })
  inventoryCategoryId: Types.ObjectId;

  @Prop()
  @IsArray()
  @IsNotEmpty()
  varients: string[];

  @Prop({ default: true })
  @IsBoolean()
  @IsOptional()
  status: boolean;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const ProductCatalogSchema =
  SchemaFactory.createForClass(ProductCatalog);

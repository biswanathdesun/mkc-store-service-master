import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsEnum, IsInt, IsNumber, IsString } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  StockEntryMemberType,
  StockEntryStatus,
  StockEntryType,
} from 'src/utills/enum';
import {
  INVALID_STOCK_ENTRY_MEMBER_TYPE,
  INVALID_STOCK_ENTRY_STATUS,
  INVALID_STOCK_ENTRY_TYPE,
} from 'src/utills/messages';

@Schema({ timestamps: true })
export class StockEntry extends Document {
  @Prop({ required: true })
  @IsString()
  title: string;

  @Prop({ required: true })
  @IsEnum(StockEntryStatus, { message: INVALID_STOCK_ENTRY_STATUS })
  stockEntryStatus: StockEntryStatus;

  @Prop({ required: true })
  @IsEnum(StockEntryType, { message: INVALID_STOCK_ENTRY_TYPE })
  stockEntryType: StockEntryType;

  @Prop({ required: true })
  @IsEnum(StockEntryMemberType, { message: INVALID_STOCK_ENTRY_MEMBER_TYPE })
  memberType: StockEntryMemberType;

  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  staffId: Types.ObjectId;

  @Prop({ required: true })
  @IsString()
  supplier: string;

  @Prop({ required: true })
  @IsNumber()
  rate: number;

  @Prop({ required: true })
  @IsNumber()
  quantity: number;

  @Prop({ required: true })
  @IsNumber()
  amount: number;

  @Prop({ required: true })
  @IsNumber()
  billNumber: number;

  @Prop({ required: true })
  @IsNumber()
  reorderQuantity: number;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Warehouse' })
  warehouseId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  @IsDate()
  buyDate: Date;

  @Prop({ required: true })
  @IsInt()
  purchasedYear: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}
export const StockEntrySchema = SchemaFactory.createForClass(StockEntry);

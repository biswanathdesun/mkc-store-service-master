import { SchemaTypes, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsBoolean } from 'class-validator';

@Schema({ timestamps: true })
class State {
  @Prop({ required: true, type: Number })
  stateId: number;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  iso2: string;
}
class City {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  cityId: number;
}
@Schema({ timestamps: true })
export class Warehouse {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  address: string;

  @Prop({ type: State })
  state: State;

  @Prop({ type: City })
  city: City;

  @Prop({ required: true, type: String })
  pincode: string;

  @Prop({ default: false })
  @IsBoolean()
  isPrimary: boolean;

  @Prop({ default: false })
  @IsBoolean()
  isShop: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}
export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Document, Types, SchemaTypes } from 'mongoose';
import { User } from './user.schema';

class State {
  @Prop()
  @IsNotEmpty()
  @IsString()
  stateId: string;

  @Prop()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop()
  @IsNotEmpty()
  @IsString()
  iso2: string;
}

class City {
  @Prop()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop()
  @IsNotEmpty()
  @IsString()
  cityId: string;
}

@Schema({ timestamps: true })
export class UserDeliveryAddress extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @IsNotEmpty()
  @IsString()
  userId: User['_id'];

  @Prop()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop()
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @Prop({ default: null })
  @IsString()
  @IsOptional()
  alternateMobile: string;

  @Prop()
  @IsNotEmpty()
  @IsString()
  pincode: string;

  @Prop()
  @IsNotEmpty()
  @IsString()
  address: string;

  @Prop({ default: null })
  @IsOptional()
  @IsString()
  landmark: string;

  @Prop({ default: null })
  state: State;

  @Prop({ default: null })
  city: City;

  @Prop({ default: false })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const UserDeliveryAddressSchema =
  SchemaFactory.createForClass(UserDeliveryAddress);

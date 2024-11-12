import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ServicePackage extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Service' })
  serviceId: Types.ObjectId;

  @Prop({ required: true })
  @IsString()
  packageName: string;

  @Prop({ required: true })
  @IsString()
  features: string[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Price' })
  priceId: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}
export const ServicePackageSchema =
  SchemaFactory.createForClass(ServicePackage);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Staff } from './staff.schema';
import { Price } from './price.schema';

@Schema({ timestamps: true })
export class CarePackage extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'CareService' })
  healthCareId: Types.ObjectId;

  @Prop({ required: true })
  @IsString()
  title: string;

  @Prop({ required: true })
  @IsString()
  image: string;

  @Prop({ required: true })
  @IsString()
  features: string[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Price' })
  priceId: Price['_id'];

  @Prop({ default: 0 })
  prebookAmount: number;

  @Prop({ required: false, default: null })
  slugUrl: string;

  @Prop({ default: 0 })
  coins: number;

  @Prop({
    required: false,
    type: [{ type: SchemaTypes.ObjectId, ref: 'HealthCareTestPackage' }],
    default: null,
  })
  testPackagesId: Types.ObjectId[];

  @Prop({ required: false, default: null })
  metaTitle: string;

  @Prop({ required: false, default: null })
  metaDescription: string;

  @Prop({ default: false })
  showOnWebsite: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Staff['_id'];

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  updatedBy: Staff['_id'];
}
export const CarePackageSchema = SchemaFactory.createForClass(CarePackage);

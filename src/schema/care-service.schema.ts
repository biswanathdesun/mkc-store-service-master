import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Staff } from './staff.schema';

@Schema({ timestamps: true })
export class CareService extends Document {
  @Prop({ required: true })
  @IsString()
  name: string;

  @Prop({ required: true })
  @IsString()
  slugUrl: string;

  @Prop({ required: true })
  @IsString()
  image: string;

  @Prop({ required: true })
  @IsString()
  description: string;

  @Prop({ default: false })
  isPreeBook: boolean;

  @Prop({ required: false, default: null })
  headScript: string;

  @Prop({ required: false, default: null })
  bodyScript: string;

  @Prop({ required: false, default: null })
  metaTitle: string;

  @Prop({ required: false, default: null })
  metaDescription: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Staff' })
  createdBy: Staff['_id'];

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Staff['_id'];
}
export const CareServiceSchema = SchemaFactory.createForClass(CareService);

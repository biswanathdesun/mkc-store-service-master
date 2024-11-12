import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty } from 'class-validator';
import { Document, Types, SchemaTypes } from 'mongoose';

@Schema({ timestamps: true })
export class Center extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  name: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;
}

export const CenterSchema = SchemaFactory.createForClass(Center);

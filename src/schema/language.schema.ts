import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Language extends Document {
  @Prop({ required: true })
  language: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const LanguageSchema = SchemaFactory.createForClass(Language);

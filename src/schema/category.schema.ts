import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Schema({
  timestamps: true,
})
export class Category extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop({ default: null })
  @IsOptional()
  image: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

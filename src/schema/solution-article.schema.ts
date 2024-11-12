import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FAQType } from 'src/utills/enum';
import { Category } from './category.schema';
import { FAQ_TYPE_ERROR } from 'src/utills/messages';

@Schema({
  timestamps: true,
})
export class SolutionArticle extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  question: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  answer: string;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsEnum(FAQType, { message: FAQ_TYPE_ERROR })
  type: FAQType;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', default: null })
  @IsOptional()
  categoryId: Category['_id'];

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const SolutionArticleSchema =
  SchemaFactory.createForClass(SolutionArticle);

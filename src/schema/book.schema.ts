import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum, IsNumber } from 'class-validator';
import { INVALID_BOOK_TYPE } from 'src/utills/messages';
import { BindingType } from 'src/utills/enum';
import { BookLanguage, BookLanguageSchema } from './book.language.schema';
import { BookTypes, BookTypesSchema } from './book.type.schema';

@Schema({ timestamps: true })
export class Book extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({
    required: true,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Course' }],
  })
  courseIds: Types.ObjectId[];

  @Prop({ required: true })
  bookName: string;

  @Prop({ required: true })
  slugUrl: string;

  @Prop({ required: true })
  @IsEnum(BindingType, { message: INVALID_BOOK_TYPE })
  bindingType: BindingType;

  @Prop({ required: true })
  bookWeight: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  longDescription: string;

  @Prop({ required: true, default: true })
  InStock: boolean;

  @Prop({ required: true })
  @IsNumber()
  totalPage: number;

  @Prop({ required: true })
  publication: string;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  skuCode: number;

  @Prop({ required: true, type: [BookLanguageSchema] })
  languageDetails: BookLanguage;

  @Prop({ required: true, type: [BookTypesSchema] })
  bookTypeDetails: BookTypes;

  @Prop({ required: false, type: String })
  metaDescription: string;

  @Prop({ required: false })
  metaTitle: string;

  @Prop({ required: false })
  metaTag: string;

  @Prop({ required: false })
  bodyTag: string;

  @Prop({ required: false, default: null, type: Number })
  averageRating: number;

  @Prop({ required: false, default: null, type: Number })
  userCountOfRating: number;

  @Prop({ required: false, default: 0, type: Number })
  coins: number;

  @Prop({ default: false })
  topSeller: boolean;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const BookSchema = SchemaFactory.createForClass(Book);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { Category } from './category.schema';
import { ProductType } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

@Schema({
  timestamps: true,
})
export class Course extends Document {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop({ default: null })
  @IsNotEmpty()
  @IsString()
  thumbnail: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category' })
  @IsNotEmpty()
  categoryId: Category['_id'];

  @Prop({ required: true })
  @IsNotEmpty()
  @IsEnum(ProductType, { message: INVALID_TYPE })
  validFor: ProductType[];

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

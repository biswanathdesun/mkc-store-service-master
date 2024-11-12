import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProductType } from 'src/utills/enum';
import { INVALID_PRODUCT_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class ReviewAndRating extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  @IsOptional()
  studentId: Types.ObjectId;

  @Prop({ required: true })
  @IsNotEmpty()
  rating: number;

  @Prop({ required: true })
  @IsNotEmpty()
  @IsEnum(ProductType, { message: INVALID_PRODUCT_TYPE })
  type: ProductType;

  @Prop()
  @IsNotEmpty()
  @IsString()
  comment: string;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Book' })
  @IsOptional()
  bookId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'OnlineCourse' })
  @IsOptional()
  onlineCourseId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'TestSeries' })
  @IsOptional()
  testId: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const ReviewAndRatingSchema =
  SchemaFactory.createForClass(ReviewAndRating);

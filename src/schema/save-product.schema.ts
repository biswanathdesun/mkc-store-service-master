import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { SavedProductTypes } from 'src/utills/enum';
import { INVALID_PRODUCT_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class SaveProduct extends Document {
  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  @IsNotEmpty()
  @IsString()
  userId: Types.ObjectId;

  @Prop()
  @IsEnum(SavedProductTypes, { message: INVALID_PRODUCT_TYPE })
  productType: SavedProductTypes;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'FreeContent' })
  @IsOptional()
  freecontentId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'TestMaster' })
  @IsOptional()
  testId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'CourseLibrary' })
  @IsOptional()
  courseLibraryId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId })
  @IsOptional()
  videoId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId })
  @IsOptional()
  pdfId: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const SaveProductSchema = SchemaFactory.createForClass(SaveProduct);

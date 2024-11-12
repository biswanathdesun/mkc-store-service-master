import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { BookType } from 'src/utills/enum';
import { INVALID_BOOK_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class BookTypes extends Document {
  @Prop({ required: true })
  @IsEnum(BookType, { message: INVALID_BOOK_TYPE })
  bookType: BookType;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Price' })
  priceId: Types.ObjectId;

  @Prop({ required: true, default: 0, type: Number })
  shippingCharge: number;
}

export const BookTypesSchema = SchemaFactory.createForClass(BookTypes);

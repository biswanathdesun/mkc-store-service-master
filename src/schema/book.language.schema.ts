import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
class PdfUrlItem {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  url: string;
}

@Schema({ timestamps: true })
export class BookLanguage extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Language' })
  languageId: Types.ObjectId;

  @Prop({
    required: false,
    type: [{ type: SchemaTypes.ObjectId, ref: 'InventoryItem' }],
  })
  itemId: Types.ObjectId[];

  @Prop({ required: true })
  thumbnail: string;

  @Prop({ required: true })
  sampleDownload: string;

  @Prop({ required: false, default: null, type: PdfUrlItem })
  actualbook: PdfUrlItem;
}

export const BookLanguageSchema = SchemaFactory.createForClass(BookLanguage);

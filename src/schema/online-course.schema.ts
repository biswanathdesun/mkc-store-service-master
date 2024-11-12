import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { IsArray, IsEnum } from 'class-validator';
import { Category } from './category.schema';
import { Course } from './course.schema';
import { SolutionArticle } from './solution-article.schema';
import {
  CourseContent,
  CourseContentSchema,
} from './online-course-content.schema';
import { Language } from './language.schema';
import { Price } from './price.schema';
import { INVALID_MODE_TYPE } from 'src/utills/messages';
import { ModeTypes } from 'src/utills/enum';

@Schema({ timestamps: true })
class ThumbnailItem {
  @Prop()
  url: string;
}

@Schema({ timestamps: true })
class VideoUrlItem {
  @Prop()
  url: string;
}

@Schema({ timestamps: true })
class ItemDetailsData {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'InventoryItem' })
  itemId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  quantity: number;
}

@Schema({ timestamps: true })
class Thumbnail {
  @Prop([{ default: null, type: ThumbnailItem }])
  imageUrl: ThumbnailItem[];

  @Prop([{ default: null, type: VideoUrlItem }])
  videoUrl: VideoUrlItem[];
}

@Schema({ timestamps: true })
export class OnlineCourse extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Category' })
  categoryId: Category['_id'];

  @Prop({
    required: true,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Course' }],
  })
  courseIds: Course['_id'][];

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Batch' })
  batchId: Types.ObjectId;

  @Prop({ required: true, default: null })
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  type: ModeTypes;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  slugUrl: string;

  @Prop({ type: String })
  shortDescription: string;

  @Prop({ type: String })
  longDescription: string;

  @Prop()
  @IsArray()
  features: Array<string>;

  @Prop({ default: null, type: Date })
  registationDate: Date;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Language' })
  languageId: Language['_id'];

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Price' })
  priceId: Price['_id'];

  @Prop({ default: null, type: Number })
  liveClassCount: number;

  @Prop({ default: null, type: Number })
  mockTestCount: number;

  @Prop({
    required: true,
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'SolutionArticle' }],
  })
  faqIds: SolutionArticle['_id'][];

  @Prop({ default: null, type: [CourseContentSchema] })
  courseContent: CourseContent[];

  @Prop({ type: Thumbnail })
  thumbnail: Thumbnail;

  @Prop({ default: null, type: Number })
  averageRating: number;

  @Prop({ default: null, type: Number })
  userCountOfRating: number;

  @Prop({ default: 0, type: Number })
  prebook_amount: number;

  @Prop({ default: 0, type: Number })
  admittedAmount: number;

  @Prop({ default: 0, type: Number })
  coins: number;

  @Prop({ default: null, type: Number })
  productCode: number;

  @Prop({ default: false })
  topSeller: boolean;

  @Prop({ required: false, default: null })
  metaTitle: string;

  @Prop({ required: false, default: null })
  metaDescription: string;

  @Prop({ required: false, default: null })
  metaTag: string;

  @Prop({ required: false, default: null })
  bodyTag: string;

  @Prop([{ required: false, type: ItemDetailsData, default: null }])
  itemDetails: ItemDetailsData[];

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const OnlineCourseSchema = SchemaFactory.createForClass(OnlineCourse);

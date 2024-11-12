import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsNotEmpty, IsString, IsArray, IsEnum } from 'class-validator';
import { ModeTypes } from 'src/utills/enum';
import { INVALID_MODE_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
class AssignTest {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'TestMaster' })
  @IsString()
  testMasterId: Types.ObjectId;
}

@Schema({ timestamps: true })
export class TestSeries extends Document {
  @Prop({ default: null })
  @IsNotEmpty()
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  mode: ModeTypes;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category' })
  @IsNotEmpty()
  @IsString()
  categoryId: Types.ObjectId;

  @Prop({
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Course' }],
  })
  @IsNotEmpty()
  courseIds: Types.ObjectId[];

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slugUrl: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  longDescription: string;

  @Prop({ required: true })
  @IsArray()
  overview: string[];

  @Prop({
    required: true,
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'Language' }],
  })
  languageIds: Types.ObjectId[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Price' })
  priceId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  noOfQuestions: number;

  @Prop({ required: true, type: Number })
  noOfQuestionPaper: number;

  @Prop({ default: null })
  image: string;

  @Prop([{ default: null, type: AssignTest }])
  assignedTest: AssignTest[];

  @Prop({ default: null, type: Number })
  averageRating: number;

  @Prop({ default: null, type: Number })
  userCountOfRating: number;

  @Prop({ default: false })
  isAssignTest: boolean;

  @Prop({ default: 0, type: Number })
  coins: number;

  @Prop({ required: false, default: null, type: Number })
  productCode: number;

  @Prop({ required: false, default: false })
  topSeller: boolean;

  @Prop({ required: false, default: null })
  metaTitle: string;

  @Prop({ required: false, default: null })
  metaDescription: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const TestSeriesSchema = SchemaFactory.createForClass(TestSeries);

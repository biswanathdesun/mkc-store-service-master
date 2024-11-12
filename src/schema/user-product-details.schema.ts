import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { BookType, ProductType } from 'src/utills/enum';
import { INVALID_BOOK_TYPE, INVALID_PRODUCT_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class UserProductDetails extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  studentId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'HealthcareUser',
    required: false,
    default: null,
  })
  healthcareUserId: Types.ObjectId;

  @Prop({ required: true })
  @IsEnum(ProductType, { message: INVALID_PRODUCT_TYPE })
  productType: ProductType;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Book' })
  bookId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'OnlineCourse' })
  onlineCourseId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Batch' })
  batchId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    required: false,
    default: null,
    ref: 'Order',
  })
  orderId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    required: false,
    default: null,
    ref: 'HospitalOrder',
  })
  healthcareOrderId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'TestSeries' })
  testId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'CarePackage' })
  carePackageId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'CareService' })
  careServiceId: Types.ObjectId;

  @Prop({
    required: false,
    default: null,
    type: [{ type: SchemaTypes.ObjectId, ref: 'HealthCareTestDatabase' }],
  })
  testDatabaseId: Types.ObjectId[];

  @Prop({ default: null })
  @IsEnum(BookType, { message: INVALID_BOOK_TYPE })
  bookType: BookType;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Language' })
  languageId: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: null })
  startDate: Date;

  @Prop({ default: null })
  validUpto: Date;

  @Prop({ default: true })
  haveAccess: boolean;

  @Prop({ default: false })
  isDroppedStatus: boolean;

  @Prop({ default: false })
  isValidUptoExtend: boolean;

  @Prop({ default: null })
  droppedDate: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId;
}

export const UserProductDetailsSchema =
  SchemaFactory.createForClass(UserProductDetails);

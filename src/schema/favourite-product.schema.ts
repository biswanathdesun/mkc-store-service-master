import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { ProductType, SchemaReferenceType } from 'src/utills/enum';
import { INVALID_PRODUCT_TYPE } from 'src/utills/messages';
import { HealthcareUser } from './health-care-user.schema';
import { User } from './user.schema';

@Schema({ timestamps: true })
export class FavouriteProduct extends Document {
  @Prop({
    required: true,
    type: SchemaTypes.ObjectId,
    refPath: 'userByModel', //TODO: Dynamic reference based on userByModel
  })
  userId: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HEALTH_CARE_USER, SchemaReferenceType.USER], //TODO: Possible values for userByModel
  })
  userByModel: SchemaReferenceType.HEALTH_CARE_USER | SchemaReferenceType.USER;

  @Prop()
  @IsEnum(ProductType, { message: INVALID_PRODUCT_TYPE })
  productType: ProductType;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Book' })
  bookId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'OnlineCourse' })
  courseId: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'TestSeries' })
  testId: Types.ObjectId;

  @Prop({
    default: null,
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'CarePackage',
  })
  carePackageId: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'createdByModel', //TODO: Dynamic reference based on createdByModel
  })
  createdBy: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HEALTH_CARE_USER, SchemaReferenceType.USER], //TODO: Possible values for createdByModel
  })
  createdByModel:
    | SchemaReferenceType.HEALTH_CARE_USER
    | SchemaReferenceType.USER;

  @Prop({
    default: null,
    type: SchemaTypes.ObjectId,
    refPath: 'updatedByModel', //TODO: Dynamic reference based on updatedByModel
  })
  updatedBy: Types.ObjectId | HealthcareUser['_id'] | User['_id'];

  @Prop({
    default: null,
    enum: [SchemaReferenceType.HEALTH_CARE_USER, SchemaReferenceType.USER], //TODO: Possible values for updatedByModel
  })
  updatedByModel:
    | SchemaReferenceType.HEALTH_CARE_USER
    | SchemaReferenceType.USER;
}

export const FavouriteProductSchema =
  SchemaFactory.createForClass(FavouriteProduct);

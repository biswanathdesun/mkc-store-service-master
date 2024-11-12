import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  HealthCareTestDBType,
  HealthCareTestInputType,
  NumericValueGenderType,
  TestNormalValueType,
} from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
class NumericRangeDetails {
  @Prop({ required: true })
  @IsEnum(NumericValueGenderType, { message: INVALID_TYPE })
  gender: NumericValueGenderType;

  @Prop({ required: true, type: Number })
  minAge: number;

  @Prop({ required: true, type: Number })
  maxAge: number;

  @Prop({ required: true, type: Number })
  lowerValue: number;

  @Prop({ required: true, type: Number })
  upperValue: number;
}

@Schema({ timestamps: true })
class NormalValueDetails {
  @Prop({ required: true })
  @IsEnum(TestNormalValueType, { message: INVALID_TYPE })
  type: TestNormalValueType;

  @Prop({ required: false, default: null })
  textDetails: string;

  @Prop([{ required: false, type: NumericRangeDetails }])
  numericRangevalue: NumericRangeDetails[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

@Schema({ timestamps: true })
class HealthCareTest {
  @Prop({ required: false, default: null })
  sequence: number;

  @Prop({ required: false, default: null })
  name: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'HealthcareUnits',
    required: false,
    default: null,
  })
  unitId: Types.ObjectId;

  @Prop({ enum: HealthCareTestInputType, required: false, default: null })
  inputType: HealthCareTestInputType;

  @Prop({ required: false, default: null })
  defaultResult: string;
}

@Schema({ timestamps: true })
export class HealthCareTestDatabase extends Document {
  @Prop({ enum: HealthCareTestDBType, default: null })
  type: HealthCareTestDBType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  shortName: string;

  @Prop({
    required: true,
    type: SchemaTypes.ObjectId,
    ref: 'PathologyCategory',
  })
  categoryId: Types.ObjectId;

  @Prop({
    required: true,
    type: SchemaTypes.ObjectId,
    ref: 'Price',
  })
  priceId: Types.ObjectId;

  @Prop({ enum: HealthCareTestInputType })
  inputType: HealthCareTestInputType;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'HealthcareUnits', default: null })
  unitId: Types.ObjectId;

  @Prop({ type: String })
  document: string;

  @Prop([{ required: false, type: HealthCareTest, default: [] }])
  parameters: HealthCareTest[];

  @Prop({ default: false })
  isNormalValue: boolean;

  @Prop({ required: false, type: NormalValueDetails, default: null })
  normalValues: NormalValueDetails;

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const HealthCareTestDatabaseSchema = SchemaFactory.createForClass(
  HealthCareTestDatabase,
);

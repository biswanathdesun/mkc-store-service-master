import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  CompareValueRangeType,
  Gender,
  HealthCareTestDBType,
  LabReportTestInputType,
} from 'src/utills/enum';
import { INVALID_GENDER } from 'src/utills/messages';

@Schema({ timestamps: true })
class NestedTestDetails {
  @Prop({ required: false, default: null })
  sequence: number;

  @Prop({ required: false, default: null })
  name: string;

  @Prop({ enum: LabReportTestInputType, default: null })
  valueType: LabReportTestInputType;

  @Prop({ enum: CompareValueRangeType, default: null })
  valueRange: CompareValueRangeType;

  @Prop({ required: false, default: null })
  value: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'HealthcareUnits',
    required: false,
    default: null,
  })
  unitId: Types.ObjectId;

  @Prop({ required: false, default: null })
  reference: string;
}

@Schema({ timestamps: true })
class AllTestDetails {
  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'HealthCareTestDatabase',
  })
  testDatabaseId: Types.ObjectId;

  @Prop({ enum: HealthCareTestDBType, default: null })
  type: HealthCareTestDBType;

  @Prop([{ required: true, type: NestedTestDetails }])
  nestedTest: NestedTestDetails[];
}

@Schema({ timestamps: true })
class TestDetails {
  @Prop({
    required: true,
    type: SchemaTypes.ObjectId,
    ref: 'PathologyCategory',
  })
  categoryId: Types.ObjectId;

  @Prop([{ required: true, type: AllTestDetails }])
  allTests: AllTestDetails[];
}

@Schema({ timestamps: true })
export class LabReport extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'HealthcareUser' })
  userId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    required: true,
    ref: 'HealthCareFinance',
  })
  paymentId: Types.ObjectId;

  @Prop({ default: null })
  @IsEnum(Gender, { message: INVALID_GENDER })
  gender: Gender;

  @Prop({ default: null, required: true })
  age: number;

  @Prop([{ required: false, type: TestDetails }])
  testDetails: TestDetails[];

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const LabReportSchema = SchemaFactory.createForClass(LabReport);

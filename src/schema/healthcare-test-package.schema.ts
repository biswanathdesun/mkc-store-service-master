import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { SchemaTypes, Types } from 'mongoose';
import { Gender } from 'src/utills/enum';

@Schema({ timestamps: true })
export class HealthCareTestPackage {
  @Prop({
    required: false,
    default: null,
    type: SchemaTypes.ObjectId,
    ref: 'PathologyCategory',
  })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  @IsEnum(Gender)
  gender: Gender[];

  @Prop([
    {
      required: true,
      type: SchemaTypes.ObjectId,
      ref: 'HealthCareTestDatabase',
    },
  ])
  testIds: Types.ObjectId[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const HealthCareTestPackageSchema = SchemaFactory.createForClass(
  HealthCareTestPackage,
);

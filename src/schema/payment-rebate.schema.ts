import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { Document, Types } from 'mongoose';
import { ModeTypes } from 'src/utills/enum';
import { INVALID_MODE_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
class ProductDetails {
  @Prop({ type: Types.ObjectId, ref: 'OnlineCourse', required: true })
  courseId: Types.ObjectId;

  @Prop()
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  type: ModeTypes;

  @Prop()
  amount: number;
}

@Schema({ timestamps: true })
export class PaymentRebate extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  totalRebateAmount: number;

  @Prop({ default: null })
  remarks: string;

  @Prop([{ required: true, type: ProductDetails }])
  productDetails: ProductDetails[];

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}

export const PaymentRebateSchema = SchemaFactory.createForClass(PaymentRebate);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import { BedTypes, ChangeHostelType } from 'src/utills/enum';
import { INVALID_BED_TYPE, INVALID_TYPE } from 'src/utills/messages';

@Schema({ timestamps: true })
export class HostelChangeHistory extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'HostelEnquiry' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Hostel' })
  hostelId: Types.ObjectId;

  @Prop({
    required: false,
    type: SchemaTypes.ObjectId,
    ref: 'Hostel',
    default: null,
  })
  changeHostelId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'HostelOrder' })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  @IsEnum(ChangeHostelType, { message: INVALID_TYPE })
  type: ChangeHostelType;

  @Prop({ required: false, default: null })
  joiningDate: Date;

  @Prop({ required: false, default: null })
  changeJoiningDate: Date;

  @Prop({ required: false, default: null })
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  bedType: BedTypes;

  @Prop({ required: false, default: null })
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  changeBedType: BedTypes;

  @Prop({ required: false, type: Number })
  roomNumber: number;

  @Prop({ required: false, type: Number })
  changeRoomNumber: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff', default: null })
  updatedBy: Types.ObjectId;
}

export const HostelChangeHistorySchema =
  SchemaFactory.createForClass(HostelChangeHistory);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsArray, IsEnum } from 'class-validator';
import { Document, SchemaTypes, Types } from 'mongoose';
import { BedTypes, Gst } from 'src/utills/enum';
import { IsNonEmptyArray } from 'src/utills/is-non-empty-array.validator';
import { INVALID_BED_TYPE, INVALID_GST } from 'src/utills/messages';

@Schema({ timestamps: true })
class ImageUrl {
  @Prop()
  url: string;
}

@Schema({ timestamps: true })
class SecurityFeeDetails {
  @Prop({ required: true, type: Number })
  sequence: number;

  @Prop({ required: true, type: Number })
  fees: number;
}

@Schema({ timestamps: true })
class BedDetails {
  @Prop({ required: true })
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  bedType: BedTypes;

  @Prop({ required: true, type: Number })
  numberOfRooms: number;

  @Prop({ required: true, type: Number })
  totalBeds: number;

  @Prop({ required: true, type: Number })
  hostelCharge: number;

  @Prop({ required: true })
  @IsEnum(Gst, { message: INVALID_GST })
  hostelGst: Gst;

  @Prop({ required: true, type: Number })
  hostelChargeWithGst: number;

  @Prop({ required: true, type: Number })
  accommodationCost: number;

  @Prop({ required: true })
  @IsEnum(Gst, { message: INVALID_GST })
  accommodationGst: Gst;

  @Prop({ required: true, type: Number })
  accommodationCostWithGst: number;

  @Prop({ required: true, type: Number })
  mealCost: number;

  @Prop({ required: true })
  @IsEnum(Gst, { message: INVALID_GST })
  mealGst: Gst;

  @Prop({ required: true, type: Number })
  mealCostWithGst: number;

  @Prop({ required: true, type: Number })
  totalGst: number;

  @Prop({ required: true, type: Number })
  totalAmount: number; //TODO - without gst

  @Prop({ required: true, type: Number })
  totalPriceToPay: number; //TODO - with gst

  @Prop({ required: true, type: Number })
  perDayCost: number;

  @Prop([{ required: true, type: SecurityFeeDetails, default: null }])
  @IsArray()
  securityFee: SecurityFeeDetails[];
}

@Schema({ timestamps: true })
class RoomDetails {
  @Prop({ required: true, type: Number })
  roomNumber: number;

  @Prop({ required: true, type: Number })
  floorNumber: number;

  @Prop({ required: true })
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  bedType: BedTypes;

  @Prop({ required: true, type: Number })
  totalBeds: number;

  @Prop({ required: true, type: Number })
  vacant: number;

  @Prop({ type: Number, default: 0 })
  purchasedBed: number;
}

@Schema({ timestamps: true })
export class Hostel extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  slugUrl: string;

  @Prop([{ type: ImageUrl, required: true }])
  @IsArray()
  @IsNonEmptyArray()
  image: ImageUrl[];

  @Prop({ required: true })
  @IsArray()
  @IsNonEmptyArray()
  facilities: string[];

  @Prop([{ type: BedDetails, required: true }])
  @IsArray()
  @IsNonEmptyArray()
  bedDetails: BedDetails[];

  @Prop([{ type: RoomDetails, default: null }])
  @IsArray()
  roomMapping: RoomDetails[];

  @Prop({ default: true })
  status: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Staff' })
  createdBy: Types.ObjectId;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Staff' })
  updatedBy: Types.ObjectId;
}
export const HostelSchema = SchemaFactory.createForClass(Hostel);

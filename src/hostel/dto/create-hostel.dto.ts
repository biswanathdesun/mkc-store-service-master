import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BedTypes, Gst } from 'src/utills/enum';
import { INVALID_BED_TYPE, INVALID_GST } from 'src/utills/messages';
import { IsNonEmptyArray } from '../../utills/is-non-empty-array.validator';

class SecurityFeeCreate {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly sequence: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly fees: number;
}

class BedDetails {
  @ApiProperty({ enum: BedTypes })
  @IsNotEmpty()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  readonly bedType: BedTypes;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly numberOfRooms: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalBeds: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly hostelCharge: number;

  @ApiProperty({ enum: Gst })
  @IsNotEmpty()
  @IsEnum(Gst, { message: INVALID_GST })
  readonly hostelGst: Gst;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly accommodationCost: number;

  @ApiProperty({ enum: Gst })
  @IsNotEmpty()
  @IsEnum(Gst, { message: INVALID_GST })
  readonly accommodationGst: Gst;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly mealCost: number;

  @ApiProperty({ enum: Gst })
  @IsNotEmpty()
  @IsEnum(Gst, { message: INVALID_GST })
  readonly mealGst: Gst;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalGst: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalPriceToPay: number;

  @ApiProperty({ type: [SecurityFeeCreate] })
  @ValidateNested({ each: true })
  @IsNonEmptyArray()
  @IsArray()
  readonly securityFee: SecurityFeeCreate[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly perDayCost: number;

  hostelChargeWithGst: number;
  accommodationCostWithGst: number;
  mealCostWithGst: number;
}
class ImageUrl {
  @ApiProperty()
  @IsNotEmpty()
  url: string;
}
export class CreateHostelDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @ApiProperty()
  @IsString()
  readonly slugUrl: string;

  @ApiProperty({ type: [ImageUrl] })
  @ValidateNested({ each: true })
  @IsNonEmptyArray()
  @IsArray()
  readonly image: ImageUrl[];

  @ApiProperty()
  @IsNonEmptyArray()
  @IsArray()
  readonly facilities: string[];

  @ApiProperty({ type: [BedDetails] })
  @ValidateNested({ each: true })
  @IsNonEmptyArray()
  @IsArray()
  readonly bedDetails: BedDetails[];
}

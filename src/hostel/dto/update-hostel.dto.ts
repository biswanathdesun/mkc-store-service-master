import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BedTypes, Gst } from 'src/utills/enum';
import { IsNonEmptyArray } from 'src/utills/is-non-empty-array.validator';
import { INVALID_BED_TYPE, INVALID_GST } from 'src/utills/messages';

class SecurityFeeUpdate {
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
  @ApiProperty()
  @IsOptional()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  readonly bedType: BedTypes;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly numberOfRooms: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly totalBeds: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly hostelCharge: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly accommodationCost: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly mealCost: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(Gst, { message: INVALID_GST })
  readonly hostelGst: Gst;

  @ApiProperty()
  @IsOptional()
  @IsEnum(Gst, { message: INVALID_GST })
  readonly accommodationGst: Gst;

  @ApiProperty()
  @IsOptional()
  @IsEnum(Gst, { message: INVALID_GST })
  readonly mealGst: Gst;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly totalGst: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly totalAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly totalPriceToPay: number;

  @ApiProperty({ type: [SecurityFeeUpdate] })
  @ValidateNested({ each: true })
  @IsNonEmptyArray()
  @IsArray()
  readonly securityFee: SecurityFeeUpdate[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly perDayCost: number;
}

class ImageUrl {
  @ApiProperty()
  @IsOptional()
  url: string;
}
export class UpdateHostelDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly address: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly slugUrl: string;

  @ApiProperty({ type: [ImageUrl] })
  @ValidateNested({ each: true })
  @IsOptional()
  @IsArray()
  readonly image: ImageUrl[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  readonly facilities: string[];

  @ApiProperty({ type: [BedDetails] })
  @ValidateNested({ each: true })
  @IsOptional()
  @IsArray()
  readonly bedDetails: BedDetails[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  readonly status: boolean;
}

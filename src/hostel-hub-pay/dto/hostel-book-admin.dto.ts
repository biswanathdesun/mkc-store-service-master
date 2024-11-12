import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  BankDetailsType,
  BedTypes,
  Gender,
  HostelPaymentType,
  HostelPriceType,
  MiscellaneousCostHostelType,
  OfflinePaymentType,
} from 'src/utills/enum';
import {
  INVALID_BED_TYPE,
  INVALID_GENDER,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_OFFLINE_PRICE_TYPE,
  INVALID_TYPE,
} from 'src/utills/messages';

class MiscellaneousDataDetails {
  @ApiProperty({ enum: MiscellaneousCostHostelType })
  @IsOptional()
  @IsEnum(MiscellaneousCostHostelType, { message: INVALID_TYPE })
  readonly reason: MiscellaneousCostHostelType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;
}

export class HostelManualBookingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly parentName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly parentNumber: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender, { message: INVALID_GENDER })
  @IsString()
  @IsOptional()
  readonly gender: Gender;

  @ApiProperty({ enum: HostelPaymentType })
  @IsEnum(HostelPaymentType, { message: INVALID_TYPE })
  @IsString()
  @IsOptional()
  readonly type: HostelPaymentType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly hostelId: string;

  @ApiProperty()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  @IsOptional()
  readonly bedType: BedTypes;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly roomNumber: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly monthCount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly daysCount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly floorNumber: number;

  @ApiProperty({ enum: HostelPriceType })
  @IsEnum(HostelPriceType, { message: INVALID_OFFLINE_PRICE_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly priceType: HostelPriceType;

  @ApiProperty({ enum: OfflinePaymentType })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly paymentType: OfflinePaymentType;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly chequeOrTransNo: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly nextPaymentDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly joiningDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly existingPaymentDate: Date;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly securityFee: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly paidSecurityFee: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly securityFeeOutStanding: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly hostelPaidAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly hostelOutstanding: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly accommodationPaidAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly accommodationOutstanding: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly mealPaidAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly mealOutstanding: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly totalDays: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly paidAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalOutstanding: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly discountedAmount: number;

  @ApiProperty({ type: [MiscellaneousDataDetails] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  readonly miscellaneousCost: MiscellaneousDataDetails[];

  @ApiProperty({ enum: BankDetailsType })
  @IsEnum(BankDetailsType, { message: INVALID_TYPE })
  @IsString()
  @IsOptional()
  readonly bankDetails: BankDetailsType;
}

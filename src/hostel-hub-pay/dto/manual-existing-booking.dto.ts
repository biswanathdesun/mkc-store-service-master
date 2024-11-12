import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import {
  BankDetailsType,
  HostelPaymentType,
  MiscellaneousCostHostelType,
  OfflinePaymentType,
} from 'src/utills/enum';
import {
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_TYPE,
} from 'src/utills/messages';

class MiscellaneousData {
  @ApiProperty({ enum: MiscellaneousCostHostelType })
  @IsNotEmpty()
  @IsEnum(MiscellaneousCostHostelType, { message: INVALID_TYPE })
  readonly reason: MiscellaneousCostHostelType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;
}

export class HostelExistingManualBookingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

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
  @IsOptional()
  @IsNumber()
  readonly monthCount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly daysCount: number;

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

  @ApiProperty({ type: [MiscellaneousData] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  readonly miscellaneousCost: MiscellaneousData[];

  @ApiProperty({ enum: BankDetailsType })
  @IsEnum(BankDetailsType, { message: INVALID_TYPE })
  @IsString()
  @IsOptional()
  readonly bankDetails: BankDetailsType;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly discountedAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  readonly isMonthChange: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly existingPaymentDate: Date;
}

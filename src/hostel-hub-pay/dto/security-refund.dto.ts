import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BedTypes, OfflinePaymentType } from 'src/utills/enum';
import {
  INVALID_BED_TYPE,
  INVALID_OFFLINE_PAYMENT_TYPE,
} from 'src/utills/messages';

export class SecurityRefundOrDepositeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly hostelId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly orderId: string;

  @ApiProperty()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  @IsNotEmpty()
  readonly bedType: BedTypes;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly securityFee: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly settledAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly roomNumber: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly floorNumber: number;

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
  @IsNotEmpty()
  @IsNumber()
  readonly adjustedAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly reason: string;
}

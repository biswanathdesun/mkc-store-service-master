import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeeTypes, ModeTypes, OfflinePaymentType } from 'src/utills/enum';
import {
  BLANK_DATE_ERROR_MESSAGE,
  INVALID_MODE_TYPE,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_TYPE,
} from 'src/utills/messages';

export class MiscellaneousPaymentDto {
  @ApiProperty({ enum: ModeTypes })
  @IsOptional()
  @IsEnum(ModeTypes, { message: INVALID_MODE_TYPE })
  readonly type: ModeTypes;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly attendanceId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly batchId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @ApiProperty({ enum: OfflinePaymentType })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly paymentType: OfflinePaymentType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly chequeOrTransNo: string;

  @ApiProperty({ enum: FeeTypes })
  @IsEnum(FeeTypes, { message: INVALID_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly feeType: FeeTypes;

  @ApiProperty()
  @IsOptional({ message: BLANK_DATE_ERROR_MESSAGE })
  @IsDateString()
  readonly attendanceDate: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OfflinePaymentType } from 'src/utills/enum';
import { INVALID_OFFLINE_PAYMENT_TYPE } from 'src/utills/messages';

export class UpdatePaymentDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly paymentId: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly amount: number;

  @ApiProperty({ enum: OfflinePaymentType })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  @IsString()
  @IsOptional()
  readonly paymentType: OfflinePaymentType;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly chequeOrTransNo: string;
}

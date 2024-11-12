import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OfflinePaymentType } from 'src/utills/enum';
import { INVALID_OFFLINE_PAYMENT_TYPE } from 'src/utills/messages';

class SalesItemsDetails {
  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly bookId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly quantity: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly languageId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly itemId: string;
}

export class SalesPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly studentId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly addressId: string;

  @ApiProperty({ type: [SalesItemsDetails] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  readonly items: SalesItemsDetails[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly discountedAmount: number;

  @ApiProperty({ enum: OfflinePaymentType })
  @IsEnum(OfflinePaymentType, { message: INVALID_OFFLINE_PAYMENT_TYPE })
  @IsString()
  readonly paymentType: OfflinePaymentType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly chequeOrTransNo: string;
}

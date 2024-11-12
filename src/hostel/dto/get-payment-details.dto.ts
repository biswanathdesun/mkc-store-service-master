import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { BedTypes, PaymentModuleType } from 'src/utills/enum';
import { INVALID_BED_TYPE } from 'src/utills/messages';

export class GetPaymentDetailsDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly hostelId: string;

  @ApiProperty({ enum: BedTypes })
  @IsOptional()
  @IsEnum(BedTypes, { message: INVALID_BED_TYPE })
  readonly bedType: BedTypes;

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
  @IsDateString()
  readonly joiningDate: Date;

  @ApiProperty({ enum: PaymentModuleType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(PaymentModuleType)
  readonly status: PaymentModuleType;
}

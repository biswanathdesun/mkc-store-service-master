import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Gender,
  OfflineCoursePriceType,
  OfflinePaymentType,
} from 'src/utills/enum';
import {
  INVALID_GENDER,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_OFFLINE_PRICE_TYPE,
} from 'src/utills/messages';

class State {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  stateId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  iso2: string;
}

class City {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  cityId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class OfflinePaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly courseId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty({ enum: OfflineCoursePriceType })
  @IsEnum(OfflineCoursePriceType, { message: INVALID_OFFLINE_PRICE_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly priceType: OfflineCoursePriceType;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly isPreBook: boolean;

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
  @IsString()
  @IsOptional()
  readonly chequeOrTransNo: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly nextPaymentDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly outstandingAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly batchId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly categoryId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly coursesId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsEnum(Gender, { message: INVALID_GENDER })
  @IsString()
  @IsOptional()
  readonly gender: Gender;

  @ApiProperty()
  @IsOptional()
  readonly state: State;

  @ApiProperty()
  @IsOptional()
  readonly city: City;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly address: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly pincode: string;

  @ApiProperty({ description: 'Optional: The parent name.' })
  @IsOptional()
  @IsString()
  readonly parentName: string;

  @ApiProperty({ description: 'Optional: The number of the parentNumber.' })
  @IsOptional()
  @IsString()
  readonly parentNumber: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly isAdmitted: boolean;
}

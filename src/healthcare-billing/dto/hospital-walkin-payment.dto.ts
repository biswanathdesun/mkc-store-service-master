import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Gender,
  HealthCarePurchaseType,
  OfflineCoursePriceType,
  OfflinePaymentType,
} from 'src/utills/enum';
import {
  INVALID_GENDER,
  INVALID_OFFLINE_PAYMENT_TYPE,
  INVALID_OFFLINE_PRICE_TYPE,
  INVALID_TYPE,
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

export class HospitalWalkInPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly name: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender, { message: INVALID_GENDER })
  @IsString()
  @IsOptional()
  readonly gender: Gender;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  readonly dob: Date;

  @ApiProperty()
  @IsOptional()
  readonly state: State;

  @ApiProperty()
  @IsOptional()
  readonly city: City;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly pincode: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly address: string;

  @ApiProperty({ description: 'Optional: The parent name.' })
  @IsOptional()
  @IsString()
  readonly parentName: string;

  @ApiProperty({ description: 'Optional: The number of the parentNumber.' })
  @IsOptional()
  @IsString()
  readonly parentNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly serviceId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly packageId: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly testDatabaseIds: string[];

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
  @IsBoolean()
  @IsOptional()
  readonly isAdmitted: boolean;

  @ApiProperty({ enum: HealthCarePurchaseType })
  @IsEnum(HealthCarePurchaseType, { message: INVALID_TYPE })
  @IsString()
  @IsNotEmpty()
  readonly purchaseProductType: HealthCarePurchaseType;
}

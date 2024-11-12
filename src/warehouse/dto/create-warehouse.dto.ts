import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

class StateDetailsW {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly stateId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly iso2: string;
}
class CityDetailsW {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cityId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;
}

export class CreateWarehouseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly address: string;

  @ApiProperty({ type: StateDetailsW })
  @IsNotEmpty()
  readonly state: StateDetailsW;

  @ApiProperty({ type: CityDetailsW })
  @IsNotEmpty()
  readonly city: CityDetailsW;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly pincode: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly isPrimary: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly isShop: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly status: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

class StateDetailsU {
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
class CityDetailsU {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cityId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;
}
export class UpdateWarehouseDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly address: string;

  @ApiProperty({ type: StateDetailsU })
  @IsOptional()
  readonly state: StateDetailsU;

  @ApiProperty({ type: CityDetailsU })
  @IsOptional()
  readonly city: CityDetailsU;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly pincode: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly isPrimary: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly isShop: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly status: boolean;
}

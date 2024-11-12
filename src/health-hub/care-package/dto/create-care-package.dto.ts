import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsNonEmptyArray } from 'src/utills/is-non-empty-array.validator';

export class CreateCarePackageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly healthCareId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  image: string;

  @ApiProperty()
  @IsNonEmptyArray()
  @IsArray()
  readonly features: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly priceId: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly prebookAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly slugUrl: string;

  @ApiProperty()
  @IsNumber()
  readonly coins: string;

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly testPackagesId: string[];

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly showOnWebsite: boolean;
}

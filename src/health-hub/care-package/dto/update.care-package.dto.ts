import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateCarePackageDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly healthCareId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  readonly features: string[];

  @ApiProperty()
  @IsOptional()
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
  readonly coins: number;

  @ApiProperty({ type: [String], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly testPackagesId: string[];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly showOnWebsite: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Units } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

export class UpdateProductCatalogDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly title: string;

  @ApiProperty()
  @IsEnum(Units, { message: INVALID_TYPE })
  @IsOptional()
  readonly unit: Units;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly inventoryCategoryId: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  readonly varients: string[];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly status: boolean;
}

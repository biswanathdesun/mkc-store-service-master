import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Units } from 'src/utills/enum';
import { INVALID_TYPE } from 'src/utills/messages';

export class CreateProductCatalogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty()
  @IsEnum(Units, { message: INVALID_TYPE })
  @IsNotEmpty()
  readonly unit: Units;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly inventoryCategoryId: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  readonly varients: string[];
}

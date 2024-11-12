import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from 'src/utills/enum';

export class ProductByIdDto {
  @ApiProperty({ enum: ProductType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  course: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isTabChange: boolean;
}

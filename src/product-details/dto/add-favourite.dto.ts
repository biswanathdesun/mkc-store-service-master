import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from 'src/utills/enum';

export class AddToFavouriteDto {
  @ApiProperty({ enum: ProductType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  status: boolean;
}

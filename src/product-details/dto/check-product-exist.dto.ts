import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookType, ProductType } from 'src/utills/enum';

export class CheckProductInCartDto {
  @ApiProperty({ enum: ProductType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ enum: BookType })
  @IsOptional()
  @IsString()
  @IsEnum(BookType)
  bookType: BookType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  languageId: string;
}

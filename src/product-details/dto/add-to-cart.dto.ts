import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookType, OfflineCoursePriceType, ProductType } from 'src/utills/enum';

export class AddToCartDto {
  @ApiProperty({ enum: ProductType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProductType)
  readonly productType: ProductType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly productId: string;

  @ApiProperty({ enum: BookType })
  @IsOptional()
  @IsString()
  @IsEnum(BookType)
  readonly bookType: BookType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly languageId: string;

  @ApiProperty({ enum: OfflineCoursePriceType })
  @IsOptional()
  @IsString()
  @IsEnum(OfflineCoursePriceType)
  readonly payment_type: OfflineCoursePriceType;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly prebook_amount: number;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  readonly nextPaymentDate: Date;
}

import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from 'src/utills/enum';

class ProductDetails {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly _id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly courseId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @ApiProperty({ enum: ProductType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProductType)
  readonly productType: ProductType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly outstandingAmount: number;
}

export class PaymentRebateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly studentId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly remarks: string;

  @ApiProperty({ type: [ProductDetails] })
  readonly productDetails: ProductDetails[];
}

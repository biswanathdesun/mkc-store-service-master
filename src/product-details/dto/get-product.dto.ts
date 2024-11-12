import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookType, PageSourceType, ProductType } from 'src/utills/enum';

export class GetProductDetailsDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly page: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly limit: string;

  @ApiProperty({ enum: ProductType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(ProductType)
  readonly type: ProductType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly course: string;

  @ApiProperty({ enum: PageSourceType })
  @IsNotEmpty()
  @IsString()
  @IsEnum(PageSourceType)
  readonly pageSource: PageSourceType;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly bookType: BookType;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProductType } from 'src/utills/enum';

export class PreBookStudentCourseChangeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly userId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  readonly orderId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly previousCourseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly currentCourseId: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  @IsNotEmpty()
  readonly productType: ProductType;
}

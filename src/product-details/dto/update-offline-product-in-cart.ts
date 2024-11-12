import { IsNumber, IsOptional, IsEnum, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OfflineCoursePriceType } from 'src/utills/enum';
import { Transform } from 'class-transformer';

export class UpdateOfflineProductDto {
  @ApiProperty({ enum: OfflineCoursePriceType })
  @IsEnum(OfflineCoursePriceType)
  readonly payment_type: OfflineCoursePriceType;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  readonly prebook_amount: number;

  @ApiProperty()
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => new Date(value)) //NOTE: Transform the string to a Date
  readonly nextPaymentDate: Date;
}

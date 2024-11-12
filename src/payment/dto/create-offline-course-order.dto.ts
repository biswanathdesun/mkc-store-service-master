import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OfflineCourseOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly outStandingAmount: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly orderId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly courseId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly nextPaymentDate: Date;
}

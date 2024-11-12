import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyFinePaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly razorpay_order_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly razorpay_payment_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly razorpay_signature: string;
}

import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpay_order_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpay_signature: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentStatus, PaymentUpdateSourceType } from 'src/utills/enum';

export class UpdatePaymentStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PaymentUpdateSourceType)
  readonly updateSource: PaymentUpdateSourceType;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  readonly paymentStatus: PaymentStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly razorpay_payment_id: string;
}

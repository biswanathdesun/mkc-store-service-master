import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyHospitalPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly order_id: string;
}

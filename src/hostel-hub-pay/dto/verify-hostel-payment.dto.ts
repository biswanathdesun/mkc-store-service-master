import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyHostelPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly order_id: string;
}

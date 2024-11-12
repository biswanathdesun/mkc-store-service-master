import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly totalAmount: number;
}

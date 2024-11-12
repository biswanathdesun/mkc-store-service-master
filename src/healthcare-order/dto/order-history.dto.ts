import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrderDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly orderId: string;
}

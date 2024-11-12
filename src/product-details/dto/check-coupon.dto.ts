import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckCouponDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly code: string;
}

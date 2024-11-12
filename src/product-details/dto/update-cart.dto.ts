import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateToCartDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  quantity: number;
}
